import express from "express";
import { deleteAccount } from "../controllers/authController.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateProfile,
  getProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// 🔐 Authentication Routes
router.post("/register", upload.single("profilePic"), registerUser); // ✅ keep only this
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", protect, logoutUser);
router.delete("/delete-account", protect, deleteAccount);
// 👤 Profile Routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, upload.single("photo"), updateProfile);

export default router;
