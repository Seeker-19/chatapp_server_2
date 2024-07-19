import { Server } from "socket.io";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { app } from "../index.js";
import { set } from "mongoose";
import { User } from "../models/UserModel.js";
import { conversationModel, messageModel } from "../models/ConverseModel.js";
import { getCommentUser } from "../helper/getComment.js";

export const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://cheerful-torte-a00401.netlify.app",
    method: ["GET", "DELETE", "POST", "PUT"],
    credentials: true,
  },
});

const onlineUsers = new Set();

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, (err) => {
    if (err) return next(err);

    const token = socket.request.cookies.token;

    if (!token) return next(new Error("Authentication error"));

    //if (!decoded) return next(new Error("Autnentication error"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded._id;
      next();
    } catch (error) {
      return next(new Error("Autnentication error"));
    }
  });
});

io.on("connection", (socket) => {
  console.log("User Connected", socket.id, "userid", socket.userId);

  socket.join(socket.userId);

  onlineUsers.add(socket.userId);

  io.emit("onlineUsers", Array.from(onlineUsers));

  socket.on("we are on message page", async (userId) => {
    console.log("userId message page", userId);

    const userDetails = await User.findById(userId).select("-password");

    const payload = {
      userDetails: userDetails,
      online: onlineUsers.has(userId),
    };

    socket.emit("message send", payload);

    //previous messages

    const getconversation = await conversationModel
      .findOne({
        $or: [
          {
            sender: socket.userId,
            receiver: userId,
          },
          {
            sender: userId,
            receiver: socket.userId,
          },
        ],
      })
      .populate("messages")
      .sort({ updatedAt: -1 });

    socket.emit("message", getconversation?.messages);
  });

  //new message

  socket.on("new message", async (data) => {
    let conversation = await conversationModel.findOne({
      $or: [
        {
          sender: data?.sender,
          receiver: data?.receiver,
        },
        {
          sender: data?.receiver,
          receiver: data?.sender,
        },
      ],
    });

    if (!conversation) {
      conversation = await conversationModel.create({
        sender: data?.sender,
        receiver: data?.receiver,
      });
    }

    const message = await messageModel.create({
      text: data?.message?.text,
      imageUrl: data?.message?.imageUrl,
      videoUrl: data?.message?.videoUrl,
      msgByUserId: data?.msgByUserId,
    });

    const saveMessage = await message.save();
    // console.log("new message", data);
    // console.log("converse", conversation);

    const updateConversation = await conversationModel.updateOne(
      {
        _id: conversation?._id,
      },
      {
        $push: {
          messages: saveMessage?._id,
        },
      }
    );

    const getconversation = await conversationModel
      .findOne({
        $or: [
          {
            sender: data?.sender,
            receiver: data?.receiver,
          },
          {
            sender: data?.receiver,
            receiver: data?.sender,
          },
        ],
      })
      .populate("messages")
      .sort({ updatedAt: -1 });

    //console.log("getconversation", getconversation);

    io.to(data?.sender).emit("message", getconversation?.messages);
    io.to(data?.receiver).emit("message", getconversation?.messages);

    const conversationSender = await getCommentUser(data?.sender);
    const conversationReceiver = await getCommentUser(data?.receiver);

    io.to(data?.sender).emit("currentUserConversation", conversationSender);
    io.to(data?.receiver).emit("currentUserConversation", conversationReceiver);
  });

  //sidebar

  socket.on("sidebar", async (currentUserId) => {
    console.log("current user", socket.userId);

    const conversation = await getCommentUser(socket.userId);

    socket.emit("currentUserConversation", conversation);
  });

  socket.on("seen", async (msgByUserId) => {
    let conversation = await conversationModel.findOne({
      $or: [
        {
          sender: socket.userId,
          receiver: msgByUserId,
        },
        {
          sender: msgByUserId,
          receiver: socket.userId,
        },
      ],
    });

    const conversationMessageId = conversation?.messages || [];

    const updatedMessages = await messageModel.updateMany(
      {
        _id: {
          $in: conversationMessageId,
        },
        msgByUserId: msgByUserId,
      },
      {
        $set: {
          seen: true,
        },
      }
    );

    const conversationSender = await getCommentUser(socket.userId);
    const conversationReceiver = await getCommentUser(msgByUserId);

    io.to(socket.userId).emit("currentUserConversation", conversationSender);
    io.to(msgByUserId).emit("currentUserConversation", conversationReceiver);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    onlineUsers.delete(socket.userId);
  });
});
