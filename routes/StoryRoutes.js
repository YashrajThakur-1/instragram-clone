const express = require("express");
const mongoose = require("mongoose");
const { jsonAuthMiddleware } = require("../authorization/auth");
const multer = require("multer");
const fs = require("fs");
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
    console.log("req.user", req.user);
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
      console.log("req.user", req.user);

      const currentUserId = req.user.userData._id;
      const { caption } = req.body;
      const mediaPath = req.file ? `uploads/${req.file.filename}` : null; // Fix the file path
      console.log("req.file", req.file);
      if (!mediaPath) {
        return res.status(400).json({ message: "Media file is required" });
      }

      const fileBuffer = fs.readFileSync(mediaPath);
      const fileType = await import("file-type");
      const mime = await fileType.fileTypeFromBuffer(fileBuffer);
      console.log("Detected MIME type:", mime);

      if (!mime) {
        return res
          .status(400)
          .json({ message: "Unable to determine file type" });
      }

      let mediaType = "";
      if (mime.mime.startsWith("image/")) {
        mediaType = "image";
      } else if (mime.mime.startsWith("video/")) {
        mediaType = "video";
      } else {
        return res.status(400).json({ message: "Unsupported file type" });
      }

      const story = new Story({
        user: currentUserId,
        media: [{ url: req.file.filename, type: mediaType }], // Save only the filename
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

// New route to increment views
router.post("/stories/:id/view", jsonAuthMiddleware, async (req, res) => {
  try {
    const storyId = req.params.id;
    const currentUserId = req.user.userData._id;
    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Check if the user has already viewed the story
    if (!story.views.includes(currentUserId)) {
      story.views.push(currentUserId);
    }

    await story.save();

    res
      .status(200)
      .json({ message: "View count incremented", views: story.views.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error incrementing view count" });
  }
});
router.get("/following-stories", jsonAuthMiddleware, async (req, res) => {
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
      message: "Data fetched successfully!",
      status: true,
      following: currentUser.following,
      stories: stories,
    });
  } catch (error) {
    // Log the error and respond with a 500 status code
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching following list and stories" });
  }
});
module.exports = router;
