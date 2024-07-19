import { connectDB } from "./data/database.js";
import { server } from "./socket/index.js";

const PORT = process.env.PORT || 5000;

connectDB();

server.listen(PORT, (req, res) => {
  console.log(`Server working at ${PORT}`);
});
