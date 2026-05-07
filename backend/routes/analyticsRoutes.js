import express from "express";
import {
  getOverviewMetrics,
  getRevenueByDay,
  getAuctionsByStatus,
  getBidFrequency,
  getTopAuctions,
  getUserGrowth,
} from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ── Protect all routes & restrict to admin only ──────────────
router.use(protect, authorizeRoles("admin"));

// ── Routes ───────────────────────────────────────────────────
router.route("/overview").get(getOverviewMetrics);
router.route("/revenue-by-day").get(getRevenueByDay);
router.route("/auctions-by-status").get(getAuctionsByStatus);
router.route("/bid-frequency").get(getBidFrequency);
router.route("/top-auctions").get(getTopAuctions);
router.route("/user-growth").get(getUserGrowth);

export default router;
