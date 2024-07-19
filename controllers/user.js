import ErrorHandler from "../middlewares/errorMiddleware.js";
import { User } from "../models/UserModel.js";
import bcrypt from "bcrypt";
import { sendCookie } from "../utils/feature.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, profile_pic } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      return next(new ErrorHandler("user already exists", 404));
    }

    const hashPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      name,
      email,
      password: hashPassword,
      profile_pic,
    });

    return res.status(201).json({
      data: user,
      success: true,
      message: "registerd successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(email);

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("Invalid email or Password", 404));
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(new ErrorHandler("Invalid Email or Password", 404));
    }

    sendCookie(user, res, `Welcome ${user.name}`, 201);
  } catch (error) {
    next(error);
  }
};

export const userDetails = async (req, res, next) => {
  try {
    return res.status(201).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res
      .status(201)
      .cookie("token", "", {
        httpOnly: true,
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0), // Immediately expire the cookie
      })
      .json({
        success: true,
        message: "logout success",
      });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = req.user;

    const { name, profile_pic } = req.body;

    if (!name && !profile_pic) {
      return res
        .status(400)
        .json({ success: false, message: "No update fields provided" });
    }

    const updateUser = await User.findByIdAndUpdate(
      { _id: user._id },
      {
        name,
        profile_pic,
      },
      {
        new: true,
      }
    );

    // const userInfo=await User.findById(user._id);

    return res.json({
      success: true,
      user: updateUser,
      message: "update success",
    });
  } catch (error) {
    next(error);
  }
};

export const SearchUser = async (req, res, next) => {
  try {
    const { search } = req.body;

    const query = new RegExp(search, "i", "g");

    const users = await User.find({
      $or: [
        {
          name: query,
        },
        {
          email: query,
        },
      ],
    }).select("-password");

    return res.status(201).json({
      success: true,
      message: "Users fetched",
      users: users,
    });
  } catch (error) {
    next(error);
  }
};
