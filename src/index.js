import express from "express";
import "dotenv/config";
import job from "./lib/cron.js";
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./lib/db.js";
import bookRoutes from "./routes/bookRoutes.js";
import uploadAiRoute from "./routes/uploadAiRoute.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

job.start();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/upload", uploadAiRoute);
app.use("/api/ai", aiRoutes);
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
  connectDB();
});
