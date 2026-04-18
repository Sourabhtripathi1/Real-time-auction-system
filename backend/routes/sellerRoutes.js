import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  submitSellerApplication,
  getMySellerStatus,
  getAllSellers,
  getSellerById,
  updateSellerStatus,
} from "../controllers/sellerAuthController.js";

const router = express.Router();

// ── Seller-facing routes ───────────────────────────────────
// POST  /api/seller/apply       — submit application for review
// GET   /api/seller/my-status   — fetch own seller status

// Named routes BEFORE /:sellerId to avoid route shadowing
router.post(
  "/apply",
  protect,
  authorizeRoles("seller"),
  submitSellerApplication,
);
router.get("/my-status", protect, authorizeRoles("seller"), getMySellerStatus);

// ── Admin-facing routes ────────────────────────────────────
// GET   /api/seller/all              — paginated seller list with filters
// GET   /api/seller/:sellerId        — full seller profile + stats
// PATCH /api/seller/:sellerId/status — change seller authorization status

router.get("/all", protect, authorizeRoles("admin"), getAllSellers);

// Parameterized routes after named ones
router.get("/:sellerId", protect, authorizeRoles("admin"), getSellerById);
router.patch(
  "/:sellerId/status",
  protect,
  authorizeRoles("admin"),
  updateSellerStatus,
);

export default router;
