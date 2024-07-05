const express = require("express");
const mongoose = require("mongoose");
const { jsonAuthMiddleware } = require("../authorization/auth");
const multer = require("multer");
const User = require("../model/UserSchema");
const Story = require("../model/StorySchema");

const router = express.Router();

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Directory to save uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Save file with a timestamp
  },
});

const upload = multer({ storage: storage });

router.get("/stories", jsonAuthMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userData._id;
    const currentUser = await User.findById(currentUserId).populate(
      "following"
    );
    const followingIds = currentUser.following.map((user) => user._id);
    const userIdsToFetchStories = [currentUserId, ...followingIds];
    const stories = await Story.find({
      user: { $in: userIdsToFetchStories },
      expiresAt: { $gt: new Date() }, // Ensure the story is not expired
    }).populate("user");
    // Respond with the fetched stories
    res.status(200).json({
      messages: "Data fetched successfully!",
      status: true,
      stories: stories,
    });
  } catch (error) {
    // Log the error and respond with a 500 status code
    console.error(error);
    res.status(500).json({ message: "Error fetching stories" });
  }
});

router.post(
  "/stories",
  jsonAuthMiddleware,
  upload.single("media"),
  async (req, res) => {
    try {
      const currentUserId = req.user.userData._id;
      console.log("UserId ");
      const { caption } = req.body;
      const media = req.file ? req.file.path : null;

      if (!media) {
        return res.status(400).json({ message: "Media file is required" });
      }

      const story = new Story({
        user: currentUserId,
        media: media,
        caption: caption,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      });

      await story.save();

      res.status(201).json(story);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding story" });
    }
  }
);

module.exports = router;
