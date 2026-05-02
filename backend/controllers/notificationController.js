import Notification from "../models/Notification.js";
import NotificationPreferences from "../models/NotificationPreferences.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { paginateQuery, buildPaginationMeta } from "../utils/paginateQuery.js";

// ── Default preferences (shared constant) ──────────────────
const DEFAULT_PREFERENCES = {
  pushNotifications: true,
  emailNotifications: false,
  preferences: {
    outbid: true,
    auction_start: true,
    auction_end: true,
    watchlist_alert: true,
    auction_won: true,
    auction_lost: true,
    seller_status: true,
    auction_status: true,
  },
};

// ── GET /api/notifications/my ──────────────────────────────
export const getMyNotifications = async (req, res, next) => {
  try {
    const { page, limit, isRead, type } = req.query;
    const { pageNum, limitNum, skip } = paginateQuery(page, limit);

    const filter = { recipient: req.user._id };

    // Optional: filter by read status
    if (isRead === "true") filter.isRead = true;
    else if (isRead === "false") filter.isRead = false;
    // "all" or undefined → no filter on isRead

    // Optional: filter by notification type
    if (type) filter.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          notifications,
          pagination: buildPaginationMeta(total, pageNum, limitNum),
          unreadCount,
        },
        "Notifications retrieved successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ── GET /api/notifications/unread-count ────────────────────
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res
      .status(200)
      .json(new ApiResponse(200, { count }, "Unread count retrieved"));
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/notifications/:id/read ──────────────────────
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not authorized to modify this notification");
    }

    notification.isRead = true;
    await notification.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, notification, "Notification marked as read"),
      );
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/notifications/read-all ──────────────────────
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } },
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { modifiedCount: result.modifiedCount },
          "All notifications marked as read",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/notifications/:id ──────────────────────────
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not authorized to delete this notification");
    }

    await Notification.findByIdAndDelete(req.params.id);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Notification deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/notifications/preferences ─────────────────────
export const getNotificationPreferences = async (req, res, next) => {
  try {
    let prefs = await NotificationPreferences.findOne({
      user: req.user._id,
    }).lean();

    // Auto-create defaults if no preferences exist
    if (!prefs) {
      const created = await NotificationPreferences.create({
        user: req.user._id,
        ...DEFAULT_PREFERENCES,
      });
      prefs = created.toObject();
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, prefs, "Notification preferences retrieved"),
      );
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/notifications/preferences ───────────────────
export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const { pushNotifications, emailNotifications, preferences } = req.body;

    const updateDoc = {};
    if (pushNotifications !== undefined)
      updateDoc.pushNotifications = pushNotifications;
    if (emailNotifications !== undefined)
      updateDoc.emailNotifications = emailNotifications;

    // Merge individual preference toggles
    if (preferences && typeof preferences === "object") {
      const allowed = [
        "outbid",
        "auction_start",
        "auction_end",
        "watchlist_alert",
        "auction_won",
        "auction_lost",
        "seller_status",
        "auction_status",
      ];

      for (const key of allowed) {
        if (preferences[key] !== undefined) {
          updateDoc[`preferences.${key}`] = Boolean(preferences[key]);
        }
      }
    }

    const prefs = await NotificationPreferences.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateDoc },
      { new: true, upsert: true, runValidators: true },
    ).lean();

    res
      .status(200)
      .json(
        new ApiResponse(200, prefs, "Notification preferences updated"),
      );
  } catch (error) {
    next(error);
  }
};
