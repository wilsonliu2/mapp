import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

// Route to handle user registration
router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password should be 6 chars long" });
    }

    // Check username length
    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "username should be 3 chars long" });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "email alrdy exist" });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "user alrdy exist" });
    }

    // Generate random profile image using Dicebear
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    // Create new user instance
    const user = new User({ email, username, password, profileImage });

    // Save user to database
    await user.save();

    // Generate auth token
    const token = generateToken(user._id);

    // Send success response with token and user info
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.log("error in register route", error);
    res.status(500).json({ message: "internal server error" });
  }
});

// Route to handle user login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password)
      return res.status(400).json({ message: "all fields are required" });

    // Check if user exists by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "invalid credentials" });

    // Compare provided password with hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "invalid credentials" });

    // Generate auth token
    const token = generateToken(user._id);

    // Send success response with token and user info
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.log("error in login route", error);
    res.status(500).json({ message: "internal server error" });
  }
});

export default router;
