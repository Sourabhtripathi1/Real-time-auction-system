import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware: require the authenticated user is an authorized seller.
 *
 * PERFORMANCE: NO redundant DB call here.
 * authMiddleware.protect() already fetches a fresh user from the DB
 * and attaches it to req.user — including a fresh sellerStatus.
 * Using req.user directly is both efficient and secure.
 *
 * Non-seller roles (admin, bidder) pass through immediately.
 */
const requireAuthorizedSeller = (req, res, next) => {
  // Only applies to sellers; other roles pass through
  if (req.user.role !== "seller") return next();

  const { sellerStatus, sellerStatusReason } = req.user;

  if (sellerStatus === "authorized") return next();

  // Map status → user-friendly error message
  const messages = {
    unverified:
      "Submit your seller application for admin review before creating auctions.",
    pending_review:
      "Your seller application is under review. Please wait for admin approval.",
    rejected: `Your seller application was rejected. Reason: ${
      sellerStatusReason || "No reason provided"
    }. You may reapply after addressing the issue.`,
    suspended: `Your seller account has been suspended. Reason: ${
      sellerStatusReason || "Contact support"
    }. Contact support for assistance.`,
  };

  return next(
    new ApiError(
      403,
      messages[sellerStatus] || "You are not authorized to create auctions.",
    ),
  );
};

export default requireAuthorizedSeller;
