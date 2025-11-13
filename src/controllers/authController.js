import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/Users.js";
import { TokenBlacklist } from "../models/TokenBlacklist.js";
import { Expense } from "../models/Expense.js";
import Income from "../models/Income.js";


// ✅ generate access and refresh tokens
const generateAccessToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

export const registerUser = async (req, res) => {
  try {
    // ✅ Use multer to handle file + body
    const { username, email, password } = req.body;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null; // ✅ optional profile image

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const user = new User({ username, email, password, photo: photoPath });
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      photo: user.photo,
      accessToken,
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ LOGIN
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/", // ✅ added for consistency
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      accessToken
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ REFRESH TOKEN
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken; // ✅ added optional chaining
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err || user._id.toString() !== decoded.id)
        return res.status(403).json({ message: "Invalid refresh token" });

      const newAccessToken = generateAccessToken(user._id);
      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error("Refresh token error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ LOGOUT
export const logoutUser = async (req, res) => {
  try {
    // ✅ safely read cookies
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token found" });
    }

    // ✅ clear cookie properly (must match same path/sameSite)
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/",
    });

    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = "";
      await user.save();
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        await TokenBlacklist.create({ token });
      }
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ Find logged-in user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Update username (if provided)
    if (username && username !== user.username) {
      // Optional: Prevent duplicate usernames
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Username already taken" });
      }
      user.username = username;
    }

    // ✅ Update password (if provided)
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // ✅ Update profile photo (local upload)
    if (req.file) {
      // normalize file path for frontend use
      user.photo = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await user.save();

    // ✅ Build absolute photo URL
    const fullPhotoUrl = `${req.protocol}://${req.get("host")}${updatedUser.photo}`;

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      photo: fullPhotoUrl,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    // req.user is set in authMiddleware.js after verifying token
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all related data
    await Expense.deleteMany({ user: userId });
    await Income.deleteMany({ user: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Failed to delete account" });
  }
};