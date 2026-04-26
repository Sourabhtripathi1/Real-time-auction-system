import mongoose, { Schema } from "mongoose";

const TokenBlacklistSchema = new Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB TTL index — auto-deletes expired entries:
    index: { expireAfterSeconds: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("TokenBlacklist", TokenBlacklistSchema);
