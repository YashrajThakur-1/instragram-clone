const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const Post = require("../model/PostSchema");
const { jsonAuthMiddleware } = require("../authorization/auth");
const User = require("../model/UserSchema");

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Adjust this path as needed
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Initialize upload
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images and Videos Only!");
  }
}
// Route to create a post
router.post(
  "/create",
  jsonAuthMiddleware,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      // Extract user information from req.user.userData
      const { id: user_id, userName, profile_picture } = req.user.userData;
      const { caption, location, hastag, tagged_users } = req.body;

      // Extract and map filenames of uploaded files
      const images = req.files["images"]
        ? req.files["images"].map((file) => file.filename)
        : [];
      const videos = req.files["videos"]
        ? req.files["videos"].map((file) => file.filename)
        : [];

      // Check if both images and videos are provided
      if (images.length > 0 && videos.length > 0) {
        return res.status(400).json({
          error: "You can only upload either images or videos, not both.",
        });
      }

      // Determine the post media type
      let post_media = [];
      if (images.length > 0) {
        post_media = images;
      } else if (videos.length > 0) {
        post_media = videos;
      }

      // Create a new post object
      const newPost = new Post({
        user_id,
        userName,
        profile_picture,
        post_media,
        caption,
        location,
        hastag,
      });

      // Save the new post to the database
      const savedPost = await newPost.save();

      // Respond with the saved post data
      res.status(201).json(savedPost);
    } catch (error) {
      // Handle errors and respond with appropriate status and message
      res.status(400).json({ error: error.message });
    }
  }
);
// Route to get all posts
router.get("/getpost", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user_id", "username") // Assuming you have a username field in the User model
      .populate("comments")
      .populate("likes");

    res.status(200).json({
      message: "Posts fetched successfully!",
      status: true,
      posts: posts,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/reels", async (req, res) => {
  try {
    // Find all public account users
    const publicUsers = await User.find({ isAccount: "Public" });

    // Extract their IDs
    const publicUserIds = publicUsers.map((user) => user._id);

    // Find all reels of public account users
    const reels = await Post.find({ userId: { $in: publicUserIds } });

    // Send the reels as a response
    res.status(200).json(reels);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
