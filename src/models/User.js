import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Define the User schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true, // Username is required
      unique: true, // Must be unique
    },
    email: {
      type: String,
      required: true, // Email is required
      unique: true, // Must be unique
    },
    password: {
      type: String,
      required: true, // Password is required
      minlength: 6, // Minimum length of 6 characters
    },
    profileImage: {
      type: String,
      default: "", // Default to empty string if not provided
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Hash password before saving user to the database
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  // Generate salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next(); // Proceed to save
});

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

// Create and export the User model
const User = mongoose.model("User", userSchema);

export default User;
