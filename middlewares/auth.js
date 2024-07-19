import jwt from "jsonwebtoken";
import { User } from "../models/UserModel.js";

export const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;

  console.log(token);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "First Login",
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded._id);

  next();
};
