import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes and verify user authentication
const protectRoute = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "unauthorized" });
    }

    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by decoded token's ID and exclude password from result
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "unauthorized" });
    }

    // Attach user to the request object
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.log("error in protect route", error);
    res.status(500).json({ message: "token verification failed" });
  }
};

export default protectRoute;
