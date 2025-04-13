import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    console.log("🔐 Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid Authorization header.");
      return res
        .status(401)
        .json({ message: "No Bearer token provided in Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    console.log("📦 Extracted Token:", token);

    if (!process.env.JWT_SECRET) {
      console.log("⚠️ JWT_SECRET is not defined in environment variables!");
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token successfully decoded:", decoded);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("❌ No user found with decoded ID:", decoded.id);
      return res
        .status(401)
        .json({ message: "Token is valid but no user found" });
    }

    console.log("👤 Authenticated user:", user.username);
    req.user = user;
    next();
  } catch (error) {
    console.log("🔥 Error in protectRoute middleware:", error.message);
    return res.status(401).json({ message: `Auth failed: ${error.message}` });
  }
};

export default protectRoute;
