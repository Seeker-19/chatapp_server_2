import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import userRouter from "./routes/user.js";
import cookieParser from "cookie-parser";

// import { app, server } from "./socket/index.js";

config({
  path: "./data/config.env",
});

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "https://chat-app-self-seven.vercel.app",
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use("/api/users", userRouter);

app.get("/", (req, res) => {
  res.send("hello");
});

app.use(errorMiddleware);
