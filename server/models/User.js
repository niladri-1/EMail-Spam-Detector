const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    picture: {
      type: String, // Google profile photo URL
    },
    locale: {
      type: String, // e.g. "en"
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    loginCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  },
);

module.exports = mongoose.model("User", userSchema);
