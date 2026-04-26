import rateLimit from "express-rate-limit";

// Auth endpoints — strict limit:
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min
  message: {
    success: false,
    message: "Too many attempts. Try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key: IP + email combination
  keyGenerator: (req) => {
    return `${req.ip}_${req.body?.email || "unknown"}`;
  },
  // Skip successful requests from count:
  skipSuccessfulRequests: true,
});

// API endpoints — generous limit:
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 req/min per IP
  message: {
    success: false,
    message: "Too many requests. Slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Bid placement — medium limit:
export const bidRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 bids/min per user
  message: {
    success: false,
    message: "Too many bid attempts. Wait before placing another bid.",
  },
  keyGenerator: (req) => {
    // Rate limit per user (not IP) for authenticated route
    return req.user?.id || req.ip;
  },
});

// File upload — strict limit:
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 uploads/hour
  message: {
    success: false,
    message: "Upload limit reached. Try again later.",
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});
