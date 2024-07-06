const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String, // URL or path to the media (image or video)
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video"], // Type of media
      required: true,
    },
  },
  {
    _id: false, // This disables the creation of an _id field for each media object
  }
);

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    media: {
      type: [mediaSchema], // Array of media objects
      required: true,
    },
    caption: String,
    views: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: 0,
      },
    ],
    finish: {
      type: String,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => Date.now() + 24 * 60 * 60 * 1000, // Default expiration time is 24 hours from creation
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Story = mongoose.model("Story", storySchema);

module.exports = Story;
