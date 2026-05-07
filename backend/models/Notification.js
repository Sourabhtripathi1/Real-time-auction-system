import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "outbid",
        "auction_start",
        "auction_end",
        "watchlist_alert",
        "auction_won",
        "auction_lost",
        "seller_approved",
        "seller_rejected",
        "auction_rejected",
        "auction_ending_soon",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    data: {
      auctionId: { type: mongoose.Schema.Types.ObjectId, default: null },
      auctionTitle: { type: String, default: null },
      bidAmount: { type: Number, default: null },
      previousBid: { type: Number, default: null },
      winnerId: { type: mongoose.Schema.Types.ObjectId, default: null },
      winnerName: { type: String, default: null },
      status: { type: String, default: null },
      reason: { type: String, default: null },
      timeLeft: { type: Number, default: null },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// ── Indexes ────────────────────────────────────────────────
// Primary query: getMyNotifications (filter by recipient + isRead, sort by newest)
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Secondary query: all notifications for a user sorted by date
notificationSchema.index({ recipient: 1, createdAt: -1 });

// TTL index: auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
