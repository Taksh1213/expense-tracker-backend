import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addIncome, getIncomes, getIncomeSummary } from "../controllers/incomeController.js";

const router = express.Router();

router.post("/", protect, addIncome);
router.get("/", protect, getIncomes);
router.get("/summary", protect, getIncomeSummary);

export default router;
