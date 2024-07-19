import { conversationModel } from "../models/ConverseModel.js";

export const getCommentUser = async (userId) => {
  const currentUserConversation = await conversationModel
    .find({
      $or: [
        {
          sender: userId,
        },
        {
          receiver: userId,
        },
      ],
    })
    .sort({ updatedAt: -1 })
    .populate("messages")
    .populate("sender")
    .populate("receiver");

  console.log(currentUserConversation);

  const conversation = currentUserConversation.map((conv) => {
    const countUnseenMsg = conv.messages.reduce((prev, current) => {
      const msgByUserId = current?.msgByUserId.toString();
      if (msgByUserId !== userId) {
        return prev + (current?.seen ? 0 : 1);
      } else {
        return prev;
      }
    }, 0);

    // console.log("count", countUnseenMsg);
    return {
      _id: conv?._id,
      sender: conv?.sender,
      receiver: conv?.receiver,
      unseenMsg: countUnseenMsg,
      lastMsg: conv.messages[conv?.messages?.length - 1],
    };
  });

  return conversation;
};
