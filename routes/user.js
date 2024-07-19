import express from "express";
import {
  login,
  logout,
  register,
  userDetails,
  updateUser,
  SearchUser,
} from "../controllers/user.js";
import jwt from "jsonwebtoken";
import { isAuthenticated } from "../middlewares/auth.js";
import { User } from "../models/UserModel.js";
const router = express.Router();

router.post("/register", register);

router.get("/verify", async (req, res, next) => {
  const { token } = req.cookies;

  //console.log(token);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No Cookies",
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded._id);

  return res.status(201).json({
    success: true,
    user: user,
    token,
  });
});

router.post("/login", login);

router.get("/getUser", isAuthenticated, userDetails);

router.get("/logout", logout);

router.post("/update", isAuthenticated, updateUser);

router.post("/search-user", isAuthenticated, SearchUser);

export default router;
