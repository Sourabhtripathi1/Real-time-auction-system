/**
 * Activity Service
 *
 * Centralized helpers for logging all user/system activities.
 * All activity creation flows through Activity.createActivity.
 * Failures are non-blocking — never crash the parent operation.
 */

import Activity from "../models/Activity.js";

// ── Helper: safe fire-and-forget wrapper ───────────────────
const safeLog = (promise) => {
  Promise.resolve(promise).catch((err) =>
    console.error("[ActivityService] Log failed:", err.message),
  );
};

// ── Bid Placed ─────────────────────────────────────────────
export async function logBidPlaced({
  userId,
  auctionId,
  auctionTitle,
  bidAmount,
  previousBid,
}) {
  return Activity.createActivity({
    userId,
    type: "bid_placed",
    action: `placed a bid of ₹${bidAmount.toLocaleString("en-IN")} on "${auctionTitle}"`,
    metadata: { auctionId, auctionTitle, bidAmount, previousBid },
    isPublic: true,
  });
}

// ── Auction Created ────────────────────────────────────────
export async function logAuctionCreated({ userId, auctionId, auctionTitle }) {
  return Activity.createActivity({
    userId,
    type: "auction_created",
    action: `created auction "${auctionTitle}"`,
    metadata: { auctionId, auctionTitle },
    isPublic: true,
  });
}

// ── Auction Started (scheduler) ────────────────────────────
export async function logAuctionStarted({ sellerId, auctionId, auctionTitle }) {
  return Activity.createActivity({
    userId: sellerId,
    type: "auction_started",
    action: `auction "${auctionTitle}" is now live`,
    metadata: { auctionId, auctionTitle },
    isPublic: true,
  });
}

// ── Auction Ended (scheduler) ──────────────────────────────
export async function logAuctionEnded({
  auctionId,
  auctionTitle,
  winnerId,
  winnerName,
  finalBid,
}) {
  const promises = [];

  // Log a personal win activity for the winner
  if (winnerId) {
    promises.push(
      Activity.createActivity({
        userId: winnerId,
        type: "auction_ended",
        action: `won auction "${auctionTitle}" for ₹${finalBid?.toLocaleString("en-IN")}`,
        metadata: { auctionId, auctionTitle, bidAmount: finalBid, winnerId, winnerName },
        isPublic: true,
      }),
    );
  }

  // Log a general global event
  promises.push(
    Activity.createActivity({
      userId: winnerId || null,
      type: "auction_ended",
      action: winnerId
        ? `"${auctionTitle}" was won by ${winnerName} for ₹${finalBid?.toLocaleString("en-IN")}`
        : `"${auctionTitle}" ended with no bids`,
      metadata: { auctionId, auctionTitle, winnerId, winnerName, bidAmount: finalBid },
      isPublic: true,
    }),
  );

  return Promise.allSettled(promises);
}

// ── Watchlist Added ────────────────────────────────────────
export async function logWatchlistAdded({ userId, auctionId, auctionTitle }) {
  return Activity.createActivity({
    userId,
    type: "watchlist_added",
    action: `added "${auctionTitle}" to watchlist`,
    metadata: { auctionId, auctionTitle },
    isPublic: false, // Private — visible to user only
  });
}

// ── Watchlist Removed ──────────────────────────────────────
export async function logWatchlistRemoved({ userId, auctionId, auctionTitle }) {
  return Activity.createActivity({
    userId,
    type: "watchlist_removed",
    action: `removed "${auctionTitle}" from watchlist`,
    metadata: { auctionId, auctionTitle },
    isPublic: false,
  });
}

// ── Seller Authorized ──────────────────────────────────────
export async function logSellerAuthorized({ adminId, sellerId, sellerName }) {
  return Activity.createActivity({
    userId: adminId,
    type: "seller_authorized",
    action: `authorized seller ${sellerName}`,
    metadata: { targetUserId: sellerId, targetUserName: sellerName },
    isPublic: false, // Admin action — private
  });
}

// ── Auction Approved ───────────────────────────────────────
export async function logAuctionApproved({
  adminId,
  auctionId,
  auctionTitle,
  sellerId,
}) {
  return Activity.createActivity({
    userId: adminId,
    type: "auction_approved",
    action: `approved auction "${auctionTitle}"`,
    metadata: { auctionId, auctionTitle, targetUserId: sellerId },
    isPublic: false,
  });
}

// ── Auction Rejected ───────────────────────────────────────
export async function logAuctionRejected({
  adminId,
  auctionId,
  auctionTitle,
  sellerId,
  reason,
}) {
  return Activity.createActivity({
    userId: adminId,
    type: "auction_rejected",
    action: `rejected auction "${auctionTitle}"`,
    metadata: { auctionId, auctionTitle, targetUserId: sellerId, reason },
    isPublic: false,
  });
}

// ── User Joined Auction ────────────────────────────────────
export async function logUserJoinedAuction({ userId, auctionId, auctionTitle }) {
  return Activity.createActivity({
    userId,
    type: "user_joined_auction",
    action: `joined auction "${auctionTitle}"`,
    metadata: { auctionId, auctionTitle },
    isPublic: true,
  });
}

export { safeLog };
