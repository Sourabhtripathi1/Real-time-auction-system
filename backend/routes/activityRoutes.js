import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyActivity,
  getGlobalActivity,
  getActivityByType,
  deleteActivity,
} from "../controllers/activityController.js";

const router = express.Router();

// All activity routes require authentication
router.use(protect);

// ── Activity Feed ──────────────────────────────────────────
router.get("/my", getMyActivity);
router.get("/global", getGlobalActivity);
router.get("/by-type/:type", getActivityByType);
router.delete("/:id", deleteActivity);

export default router;
