const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Post schema
const postSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  images: [
    {
      type: String,
      required: false,
    },
  ],
  videos: [
    {
      type: String,
      required: false,
    },
  ],
  caption: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
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
