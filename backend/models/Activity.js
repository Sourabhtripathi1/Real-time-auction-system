import mongoose from "mongoose";

const ACTIVITY_TYPES = [
  "bid_placed",
  "auction_created",
  "auction_started",
  "auction_ended",
  "watchlist_added",
  "watchlist_removed",
  "seller_authorized",
  "auction_approved",
  "auction_rejected",
  "user_joined_auction",
];

const ActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    metadata: {
      auctionId: { type: mongoose.Schema.Types.ObjectId, default: null },
      auctionTitle: { type: String, default: null },
      bidAmount: { type: Number, default: null },
      previousBid: { type: Number, default: null },
      winnerId: { type: mongoose.Schema.Types.ObjectId, default: null },
      winnerName: { type: String, default: null },
      targetUserId: { type: mongoose.Schema.Types.ObjectId, default: null },
      targetUserName: { type: String, default: null },
      reason: { type: String, default: null },
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // Disable auto-timestamps (we manage createdAt manually for TTL)
    timestamps: false,
  },
);

// ── Indexes ────────────────────────────────────────────────
// Primary query: get user's own activity feed (sorted newest first)
ActivitySchema.index({ user: 1, createdAt: -1 });

// Filter by type across all users
ActivitySchema.index({ type: 1, createdAt: -1 });

// Global public feed
ActivitySchema.index({ isPublic: 1, createdAt: -1 });

// TTL index: auto-delete activities older than 90 days
ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// ── Static: create + broadcast ─────────────────────────────
ActivitySchema.statics.createActivity = async function ({
  userId,
  type,
  action,
  metadata = {},
  isPublic = true,
}) {
  // Guard: userId is required; skip if null (e.g. no-winner auction end)
  if (!userId) return null;

  try {
    const activity = await this.create({
      user: userId,
      type,
      action,
      metadata,
      isPublic,
      createdAt: new Date(),
    });

    // Populate user for socket broadcast
    await activity.populate("user", "name profileImage");

    // ── Socket.IO broadcast ──────────────────────────────────
    const io = global.io;
    if (io) {
      const payload = {
        id: activity._id,
        user: activity.user,
        type: activity.type,
        action: activity.action,
        metadata: activity.metadata,
        isPublic: activity.isPublic,
        createdAt: activity.createdAt,
      };

      // Broadcast to user's personal feed room
      io.to(`user_${userId}`).emit("newActivity", payload);

      // If public, also broadcast to global activity feed room
      if (isPublic) {
        io.to("global_activity").emit("newActivity", payload);
      }
    }

    return activity;
  } catch (err) {
    // Activity failures must never crash the parent operation
    console.error("[ActivityModel] createActivity failed:", err.message);
    return null;
  }
};

export const ACTIVITY_TYPES_LIST = ACTIVITY_TYPES;

const Activity = mongoose.model("Activity", ActivitySchema);

export default Activity;
