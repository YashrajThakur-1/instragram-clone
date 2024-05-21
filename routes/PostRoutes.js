const express = require("express");
const Post = require("../model/PostSchema");
const router = express.Router();
// const Post = require("./models/Post"); // Adjust the path as necessary
// Create a new post
router.post("/posts", async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all posts
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user_id")
      .populate("comments")
      .populate("likes");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific post by ID
router.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user_id")
      .populate("comments")
      .populate("likes");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a post by ID
router.patch("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a post by ID
router.delete("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
