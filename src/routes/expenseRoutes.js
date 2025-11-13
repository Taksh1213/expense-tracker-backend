import express from "express";
import {
  addExpense,
  getAllExpenses,
  getSummary,
  getRecentExpenses,
  getCategoryBreakdown,
  deleteExpense,
  getExpenseById,
  updateExpense,
} from "../controllers/expenseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addExpense);
router.get("/", protect, getAllExpenses);
router.get("/summary", protect, getSummary);
router.get("/recent", protect, getRecentExpenses);
router.get("/categories", protect, getCategoryBreakdown);
router.get("/:id", protect, getExpenseById);
router.put("/:id", protect, updateExpense);
router.delete("/:id", protect, deleteExpense);

export default router;
