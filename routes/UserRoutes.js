const express = require("express");

const User = require("../model/UserSchema");
const {
  jsonAuthMiddleware,
  generateToken,
  generateResetToken,
} = require("../authorization/auth");
const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = generateToken({ id: user._id });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot password (reset link generation)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate password reset token
    const resetToken = generateResetToken();

    // TODO: Save resetToken to user record with expiration and send resetToken to user's email address (not implemented here)

    res.json({ message: "Password reset link has been sent to your email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    // TODO: Verify resetToken and find user (not implemented here)
    const user = await User.findOne({ resetToken: token });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Invalid token or user not found" });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password has been reset" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (protected route)
router.get("/users", jsonAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single user (protected route)
router.get("/users/:id", jsonAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a user (protected route)
router.put("/users/:id", jsonAuthMiddleware, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a user (protected route)
router.delete("/users/:id", jsonAuthMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
