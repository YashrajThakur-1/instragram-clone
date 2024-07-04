const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const Post = require("../model/PostSchema");
const { jsonAuthMiddleware } = require("../authorization/auth");
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
      const user_id = req.user.userData.id;
      console.log("first", req.user.userData.id);
      const { caption, location } = req.body;

      const images = req.files["images"]
        ? req.files["images"].map((file) => file.filename)
        : [];
      const videos = req.files["videos"]
        ? req.files["videos"].map((file) => file.filename)
        : [];

      const newPost = new Post({
        user_id: user_id,
        images: images,
        videos: videos,
        caption: caption,
        location: location,
      });

      const savedPost = await newPost.save();

      res.status(201).json(savedPost);
    } catch (error) {
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

// Additional routes for updating and deleting posts can be added similarly

module.exports = router;
