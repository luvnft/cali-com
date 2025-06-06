import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { CONSTANTS } from "./constant";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ message: "healthy" });
});

app.listen(CONSTANTS.PORT, () => {
  console.log(`⚡ Server is running on localhost:${CONSTANTS.PORT}`);
});
