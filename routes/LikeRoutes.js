const express = require("express");
const Like = require("../model/LikeSchema");
const router = express.Router();
const { jsonAuthMiddleware } = require("../authorization/auth");
// Create a new like
router.post("/toggle-like", jsonAuthMiddleware, async (req, res) => {
  try {
    const { post_id } = req.body;
    const user_id = req.user.userData.id;

    // Check if the user has already liked the post
    const existingInteraction = await Like.findOne({ post_id, user_id });

    if (existingInteraction) {
      // If the user has already liked the post, remove the like
      await Like.deleteOne({ _id: existingInteraction._id });
      return res.json({ message: "Like removed" });
    } else {
      // If the user has not liked the post, add a new like
      const newLike = new Like({ post_id, user_id, type: "like" });
      await newLike.save();
      res.status(201).json(newLike);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// Get all likes for a specific post
router.get("/posts/:postId/likes", async (req, res) => {
  try {
    const likes = await Like.find({ post_id: req.params.postId }).populate(
      "user_id"
    );
    res.json(likes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific like by ID
router.get("/likes/:id", async (req, res) => {
  try {
    const like = await Like.findById(req.params.id).populate("user_id");
    if (!like) {
      return res.status(404).json({ message: "Like not found" });
    }
    res.json(like);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a like by ID
router.delete("/likes/:id", async (req, res) => {
  try {
    const like = await Like.findByIdAndDelete(req.params.id);
    if (!like) {
      return res.status(404).json({ message: "Like not found" });
    }
    res.json({ message: "Like deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
