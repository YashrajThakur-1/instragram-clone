const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../model/UserSchema");
const {
  jsonAuthMiddleware,
  generateToken,
  generateResetToken,
} = require("../authorization/auth");
const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });
// Register a new user
router.post("/register", upload.single("profile_picture"), async (req, res) => {
  try {
    const { username, email, password, bio } = req.body;
    console.log("Req body>>>>>>>>>>>", req.body);

    const profile_picture = req.file ? req.file.filename : null;
    console.log("File>>>>>>>>>>>", profile_picture);

    const newUser = new User({
      username,
      email,
      password,
      profile_picture,
      bio,
    });

    await newUser.save();
    const token = generateToken(newUser);

    console.log("token>>>>>>>>>>", token);
    res.status(201).json({
      message: "User added successfully!",
      status: "true",
      user: newUser,
      token: token,
    });
  } catch (err) {
    console.log("Error>>>>>", err.message);
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
router.post("/users", async (req, res) => {
  try {
    const { offset, limit, search } = req.body; // Change 'page' to 'offset'
    const parsedOffset = parseInt(offset) || 0; // Default offset to 0 if not provided
    const parsedLimit = parseInt(limit) || 10; // Default to limit of 10 if not provided
    let searchQuery = {};
    if (search) {
      const regex = new RegExp(search, "i"); // Case-insensitive search
      searchQuery = {
        $or: [{ username: regex }],
      };
    }

    console.log("Offset:", parsedOffset);
    console.log("Limit:", parsedLimit);

    const data = await User.find(searchQuery)
      .limit(parsedLimit)
      .skip(parsedOffset) // Use offset instead of startIndex
      .exec();

    const totalCount = await User.countDocuments(searchQuery);

    const pagination = {};

    if (parsedOffset + parsedLimit < totalCount) {
      pagination.next = {
        offset: parsedOffset + parsedLimit, // Update offset for next page
        limit: parsedLimit,
      };
    }

    if (parsedOffset > 0) {
      pagination.prev = {
        offset: Math.max(parsedOffset - parsedLimit, 0), // Ensure offset doesn't go negative
        limit: parsedLimit,
      };
    }

    res.status(200).json({ data: data, totalCount: totalCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
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
router.post("/toggle-follow/:id", jsonAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.userData.id; // The ID of the logged-in user
    const targetUserId = req.params.id; // The ID of the user to follow/unfollow

    // Check if the user is trying to follow/unfollow themselves
    if (userId === targetUserId) {
      return res
        .status(400)
        .json({ error: "You cannot follow/unfollow yourself." });
    }

    // Find both users
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    // Check if the user is already following the target user
    const isFollowing = user.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow the user
      user.following.pull(targetUserId);
      targetUser.followers.pull(userId);
      await user.save();
      await targetUser.save();
      res
        .status(200)
        .json({ message: `You have unfollowed ${targetUser.username}.` });
    } else {
      // Follow the user
      user.following.push(targetUserId);
      targetUser.followers.push(userId);
      await user.save();
      await targetUser.save();
      res
        .status(200)
        .json({ message: `You are now following ${targetUser.username}.` });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
