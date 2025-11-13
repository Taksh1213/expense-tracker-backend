import jwt from "jsonwebtoken";
import { User } from "../models/Users.js";
import { TokenBlacklist } from "../models/TokenBlacklist.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Support both lowercase and uppercase headers
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // Check if blacklisted
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      console.log("🚫 Token is blacklisted");
      return res.status(401).json({ message: "Token expired or invalid" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please log in again" });
    }

    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
