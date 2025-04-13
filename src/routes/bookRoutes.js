import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Route to create a new book
router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, image, rating } = req.body;

    // Validate required fields
    if (!title || !caption || !image || !rating) {
      return res.status(400).json({ message: "all fields are required" });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(image);
    const imageUrl = result.secure_url;

    // Create a new book document
    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id, // Associate book with logged-in user
    });

    // Save book to database
    await newBook.save();

    // Return created book
    res.status(201).json(newBook);
  } catch (error) {
    console.log("error in create book route", error);
    res.status(500).json({ message: "internal server error" });
  }
});

// Route to fetch all books with pagination
router.get("/", protectRoute, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;

    // Fetch books with pagination, newest first, and populate user info
    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    // Get total number of books for pagination metadata
    const total = await Book.countDocuments();
    res.send({
      books,
      currentPage: page,
      totalBooks: total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.log("error in get books route", error);
    res.status(500).json({ message: "internal server error" });
  }
});

// Route to fetch books created by the logged-in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    // Find books by the user's ID and sort by creation date
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(books);
  } catch (error) {
    console.log("error in get user books route", error);
    res.status(500).json({ message: "internal server error" });
  }
});

// Route to delete a book by ID
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the book by ID
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "book not found" });
    }

    // Ensure the user is authorized to delete the book
    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "unauthorized" });
    }

    // Delete image from Cloudinary if it exists
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.log("error in deleting image from cloudinary", error);
      }
    }

    // Delete the book from the database
    await book.deleteOne();
    res.status(200).json({ message: "book deleted successfully" });
  } catch (error) {
    console.log("error in delete book route", error);
    res.status(500).json({ message: "internal server error" });
  }
});

export default router;
