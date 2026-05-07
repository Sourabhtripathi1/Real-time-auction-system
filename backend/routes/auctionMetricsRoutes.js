import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getAuctionMetrics,
  getSellerAuctionMetrics,
} from "../controllers/auctionMetricsController.js";

const router = express.Router();

// Get metrics for all seller auctions (Admin/Seller only)
router.get(
  "/seller/performance",
  protect,
  authorizeRoles("seller", "admin"),
  getSellerAuctionMetrics
);

// Get metrics for a specific auction (Any authenticated user)
router.get("/:id/metrics", protect, getAuctionMetrics);

export default router;
