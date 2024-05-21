const express = require("express");
const Comment = require("../model/CommentSchema");
const router = express.Router();
// const Comment = require("./models/Comment"); // Adjust the path as necessary

// Create a new comment
router.post("/comments", async (req, res) => {
  try {
    const comment = new Comment(req.body);
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all comments for a specific post
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const comments = await Comment.find({
      post_id: req.params.postId,
    }).populate("user_id");
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific comment by ID
router.get("/comments/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate("user_id");
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a comment by ID
router.patch("/comments/:id", async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a comment by ID
router.delete("/comments/:id", async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
