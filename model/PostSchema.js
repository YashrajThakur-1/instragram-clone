const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Post schema
const postSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  user_name: {
    type: String,
    required: true,
  },
  profile_picture: {
    type: String,
    required: true,
  },
  post_media: {
    type: [String], // Changed to array to store multiple file names
    required: true,
  },
  caption: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  hashtag: {
    type: String,
  },
  tagged_users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the updated_at field
postSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

// Define relationships
postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post_id",
  justOne: false,
});

postSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "post_id",
  justOne: false,
});

// Ensure virtual fields are serialized
postSchema.set("toObject", { virtuals: true });
postSchema.set("toJSON", { virtuals: true });

// Create the Post model
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
