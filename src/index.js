import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// ✅ Fix for ESM paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middleware
app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://expense-tracker-taksh.vercel.app/",
    ],
    credentials: true,
  })
);

// ✅ Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Connect MongoDB
connectDB();

// ✅ Routes
app.use("/api/auth", authRoutes);

app.use("/api/expenses", expenseRoutes);

app.use("/api/income", incomeRoutes);

// ✅ Default Route
app.get("/", (req, res) => {
  res.send("💸 Expense Tracker API running...");
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});