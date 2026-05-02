import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/notificationController.js";

const router = express.Router();

// All notification routes are protected (require auth)
router.use(protect);

// ── Notification CRUD ──────────────────────────────────────
router.get("/my", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

// ── Notification Preferences ───────────────────────────────
router.get("/preferences", getNotificationPreferences);
router.patch("/preferences", updateNotificationPreferences);

export default router;
