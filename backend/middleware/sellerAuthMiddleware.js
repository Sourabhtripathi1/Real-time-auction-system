import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware: require the authenticated user is an authorized seller.
 * Uses a FRESH DB fetch — status changes take effect immediately
 * without requiring the seller to re-login.
 *
 * Non-seller roles pass through (admin, bidder).
 */
const requireAuthorizedSeller = async (req, res, next) => {
  try {
    // Only applies to sellers; skip for other roles
    if (req.user.role !== "seller") return next();

    const user = await User.findById(req.user.id).select(
      "role sellerStatus sellerStatusReason isBlocked",
    );
    if (!user)
      return next(new ApiError(401, "User not found. Please log in again."));

    const { sellerStatus, sellerStatusReason } = user;

    if (sellerStatus === "authorized") return next();

    const messages = {
      unverified:
        "Submit your seller application for admin review before creating auctions.",
      pending_review:
        "Your seller application is under review. Please wait for admin approval.",
      rejected: `Your seller application was rejected. Reason: ${sellerStatusReason || "No reason provided"}. You may reapply after addressing the issue.`,
      suspended: `Your seller account has been suspended. Reason: ${sellerStatusReason || "Contact support"}. Contact support for assistance.`,
    };

    return next(
      new ApiError(
        403,
        messages[sellerStatus] || "You are not authorized to create auctions.",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export default requireAuthorizedSeller;
