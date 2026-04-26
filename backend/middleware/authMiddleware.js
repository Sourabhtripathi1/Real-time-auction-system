import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/User.js";

/**
 * SECURITY NOTE: This middleware performs a fresh DB lookup on EVERY
 * protected request. This adds ~2-5ms per request (negligible due to
 * MongoDB _id indexing) but is INTENTIONAL and REQUIRED.
 *
 * DO NOT cache this result — a stale cache would defeat the entire
 * purpose of catching blocked/revoked users mid-session.
 *
 * This ensures:
 * 1. Deleted users cannot use their old tokens.
 * 2. Blocked users are denied immediately — no stale JWT bypass.
 * 3. req.user ALWAYS has fresh sellerStatus (prevents stale JWT attacks).
 */
export const protect = async (req, res, next) => {
  try {
    // ── Extract token ──────────────────────────────────────
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new ApiError(401, "Not authorized, no token provided"));
    }

    // ── Verify JWT signature / expiry ──────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return next(new ApiError(401, "Session expired. Please login again."));
      }
      if (jwtErr.name === "JsonWebTokenError") {
        return next(new ApiError(401, "Invalid token. Please login again."));
      }
      // Unexpected JWT error — pass to global error handler
      return next(jwtErr);
    }

    // ── Fresh DB lookup — the core of stale JWT prevention ─
    const user = await User.findById(decoded.id)
      .select("_id name email role isBlocked sellerStatus sellerStatusReason profileImage")
      .lean();

    // Case a: User was deleted after token was issued
    if (!user) {
      return next(new ApiError(401, "User no longer exists."));
    }

    // Case b: User was blocked after token was issued
    if (user.isBlocked) {
      return next(
        new ApiError(
          403,
          "Your account has been blocked. Contact support.",
        ),
      );
    }

    // Case c: Seller was suspended after token was issued
    // (sellerAuthMiddleware handles finer-grained seller checks,
    //  but we catch hard suspensions here for any route)
    if (user.role === "seller" && user.sellerStatus === "suspended") {
      return next(
        new ApiError(
          403,
          "Your seller account has been suspended. Contact support.",
        ),
      );
    }

    // ── Attach FRESH user data to request ─────────────────
    // Using fresh DB data — NOT the JWT payload (which could be stale)
    req.user = {
      id: user._id,
      _id: user._id, // keep _id alias for backward compat
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      sellerStatus: user.sellerStatus,
      sellerStatusReason: user.sellerStatusReason,
      profileImage: user.profileImage,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// ── Role guard helpers ─────────────────────────────────────
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return next(new ApiError(403, "Admin access required."));
  }
  next();
};
