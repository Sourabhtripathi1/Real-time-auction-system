/**
 * Centralized Notification Service
 *
 * ALL notification creation flows through this service.
 * Never create Notification documents directly elsewhere.
 *
 * Responsibilities:
 * 1. Check user notification preferences
 * 2. Persist notification to MongoDB
 * 3. Push real-time via Socket.IO (user_${id} room)
 */

import Notification from "../models/Notification.js";
import NotificationPreferences from "../models/NotificationPreferences.js";

// ── Preference-type mapping ────────────────────────────────
// Maps notification type → preferences key
const TYPE_TO_PREF_KEY = {
  outbid: "outbid",
  auction_start: "auction_start",
  auction_end: "auction_end",
  watchlist_alert: "watchlist_alert",
  auction_won: "auction_won",
  auction_lost: "auction_lost",
  seller_approved: "seller_status",
  seller_rejected: "seller_status",
  auction_approved: "auction_status",
  auction_rejected: "auction_status",
};

// ── Default preferences (used when no prefs doc exists) ────
const DEFAULT_PREFERENCES = {
  pushNotifications: true,
  preferences: {
    outbid: true,
    auction_start: true,
    auction_end: true,
    watchlist_alert: true,
    auction_won: true,
    auction_lost: true,
    seller_status: true,
    auction_status: true,
  },
};

// ── Core: create + push a single notification ──────────────
export async function createNotification({
  recipientId,
  type,
  title,
  message,
  data = {},
}) {
  try {
    // 1. Check user preferences
    let prefs = await NotificationPreferences.findOne({
      user: recipientId,
    }).lean();

    // Auto-create defaults if no preferences document exists
    if (!prefs) {
      prefs = await NotificationPreferences.create({
        user: recipientId,
        ...DEFAULT_PREFERENCES,
      });
      prefs = prefs.toObject();
    }

    // 2. Check if user wants this notification type
    const prefKey = TYPE_TO_PREF_KEY[type];
    const userWantsNotif =
      prefs.pushNotifications !== false &&
      prefs.preferences?.[prefKey] !== false;

    if (!userWantsNotif) return null;

    // 3. Persist notification
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      data,
    });

    // 4. Push real-time via Socket.IO
    const io = global.io;
    if (io) {
      io.to(`user_${recipientId}`).emit("newNotification", {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: false,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (err) {
    // Notification failures should never crash the main operation
    console.error(
      `[NotificationService] Failed to create notification for ${recipientId}:`,
      err.message,
    );
    return null;
  }
}

// ── Helper: Outbid ─────────────────────────────────────────
export async function notifyOutbid({
  bidderId,
  auctionId,
  auctionTitle,
  newBid,
  previousBid,
}) {
  return createNotification({
    recipientId: bidderId,
    type: "outbid",
    title: "You've been outbid!",
    message: `Someone placed a higher bid of ₹${newBid.toLocaleString()} on "${auctionTitle}"`,
    data: { auctionId, auctionTitle, bidAmount: newBid, previousBid },
  });
}

// ── Helper: Auction Start (watchlist users) ────────────────
export async function notifyAuctionStart({
  auctionId,
  auctionTitle,
  watchlistUserIds,
}) {
  const promises = watchlistUserIds.map((userId) =>
    createNotification({
      recipientId: userId,
      type: "auction_start",
      title: "Auction is now live!",
      message: `"${auctionTitle}" from your watchlist is now active`,
      data: { auctionId, auctionTitle },
    }),
  );
  return Promise.allSettled(promises);
}

// ── Helper: Auction End (winner + losers) ──────────────────
export async function notifyAuctionEnd({
  auctionId,
  auctionTitle,
  winnerId,
  winnerName,
  finalBid,
  allBidderIds,
}) {
  const promises = [];

  // Notify winner
  if (winnerId) {
    promises.push(
      createNotification({
        recipientId: winnerId,
        type: "auction_won",
        title: "Congratulations! You won!",
        message: `You won "${auctionTitle}" for ₹${finalBid.toLocaleString()}`,
        data: { auctionId, auctionTitle, bidAmount: finalBid },
      }),
    );
  }

  // Notify all other bidders (they lost)
  const loserIds = allBidderIds.filter(
    (id) => id.toString() !== winnerId?.toString(),
  );

  for (const userId of loserIds) {
    promises.push(
      createNotification({
        recipientId: userId,
        type: "auction_lost",
        title: "Auction ended",
        message: `"${auctionTitle}" was won by ${winnerName || "another bidder"} for ₹${finalBid.toLocaleString()}`,
        data: {
          auctionId,
          auctionTitle,
          winnerId,
          winnerName,
          bidAmount: finalBid,
        },
      }),
    );
  }

  return Promise.allSettled(promises);
}

// ── Helper: Seller Status Change ───────────────────────────
export async function notifySellerStatusChange({ sellerId, status, reason }) {
  const messages = {
    authorized: {
      title: "Seller account authorized!",
      message:
        "Your seller application has been approved. You can now create auctions.",
    },
    rejected: {
      title: "Seller application rejected",
      message: `Your application was rejected. Reason: ${reason || "Not specified"}`,
    },
    suspended: {
      title: "Account suspended",
      message: `Your seller account has been suspended. Reason: ${reason || "Not specified"}`,
    },
  };

  const msgData = messages[status];
  if (!msgData) return null;

  return createNotification({
    recipientId: sellerId,
    type: status === "authorized" ? "seller_approved" : "seller_rejected",
    title: msgData.title,
    message: msgData.message,
    data: { status, reason: reason || null },
  });
}

// ── Helper: Auction Status Change ──────────────────────────
export async function notifyAuctionStatusChange({
  sellerId,
  auctionId,
  auctionTitle,
  status,
  reason,
}) {
  const messages = {
    approved: {
      title: "Auction approved!",
      message: `Your auction "${auctionTitle}" has been approved by admin`,
    },
    rejected: {
      title: "Auction rejected",
      message: `Your auction "${auctionTitle}" was rejected. Reason: ${reason || "Not specified"}`,
    },
  };

  const msgData = messages[status];
  if (!msgData) return null;

  return createNotification({
    recipientId: sellerId,
    type: status === "approved" ? "auction_approved" : "auction_rejected",
    title: msgData.title,
    message: msgData.message,
    data: { auctionId, auctionTitle, status, reason: reason || null },
  });
}
