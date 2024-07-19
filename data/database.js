import mongoose, { mongo } from "mongoose";

export const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URL, {
      dbName: "backendChat",
    })
    .then((c) => console.log(`Databse Connected with ${c.connection}`))
    .catch((e) => console.log(e));
};
