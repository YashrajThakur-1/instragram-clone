const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["like", "dislike"],
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;
