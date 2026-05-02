import mongoose from "mongoose";

const notificationPreferencesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    emailNotifications: {
      type: Boolean,
      default: false,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    preferences: {
      outbid: { type: Boolean, default: true },
      auction_start: { type: Boolean, default: true },
      auction_end: { type: Boolean, default: true },
      watchlist_alert: { type: Boolean, default: true },
      auction_won: { type: Boolean, default: true },
      auction_lost: { type: Boolean, default: true },
      seller_status: { type: Boolean, default: true },
      auction_status: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  },
);

const NotificationPreferences = mongoose.model(
  "NotificationPreferences",
  notificationPreferencesSchema,
);

export default NotificationPreferences;
