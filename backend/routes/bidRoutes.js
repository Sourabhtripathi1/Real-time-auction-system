import express from "express";
import {
  placeBid,
  getBidsByAuction,
  getMyBids,
} from "../controllers/bidController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles, restrictRoles } from "../middleware/roleMiddleware.js";
import { bidRateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Named routes first (before /:auctionId param to avoid conflicts)
router.get("/my-bids", protect, authorizeRoles("bidder"), getMyBids);

router.post(
  "/place",
  protect,
  bidRateLimiter,
  authorizeRoles("bidder"),
  placeBid,
);
router.get("/:auctionId", restrictRoles("admin", "seller"), getBidsByAuction);

export default router;
