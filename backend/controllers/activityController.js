import Activity, { ACTIVITY_TYPES_LIST } from "../models/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { paginateQuery, buildPaginationMeta } from "../utils/paginateQuery.js";

// ── GET /api/activity/my ────────────────────────────────────
export const getMyActivity = async (req, res, next) => {
  try {
    const { pageNum, limitNum, skip } = paginateQuery(req.query);
    const { type, startDate, endDate } = req.query;

    // Build filter for the requesting user only
    const filter = { user: req.user._id };

    if (type) {
      if (!ACTIVITY_TYPES_LIST.includes(type)) {
        throw new ApiError(400, `Invalid activity type: ${type}`);
      }
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate("user", "name profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Activity.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        { activities, pagination: buildPaginationMeta(total, pageNum, limitNum) },
        "Activity feed retrieved successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ── GET /api/activity/global ────────────────────────────────
// Returns all public activities — admin-accessible by default,
// but this can be opened to all authenticated users.
export const getGlobalActivity = async (req, res, next) => {
  try {
    const { pageNum, limitNum, skip } = paginateQuery(req.query);
    const { type, startDate, endDate } = req.query;

    const filter = {};

    // Non-admins can only see public activities
    if (req.user.role !== "admin") {
      filter.isPublic = true;
    }

    if (type) {
      if (!ACTIVITY_TYPES_LIST.includes(type)) {
        throw new ApiError(400, `Invalid activity type: ${type}`);
      }
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate("user", "name profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Activity.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        { activities, pagination: buildPaginationMeta(total, pageNum, limitNum) },
        "Global activity feed retrieved successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ── GET /api/activity/by-type/:type ────────────────────────
export const getActivityByType = async (req, res, next) => {
  try {
    const { type } = req.params;

    if (!ACTIVITY_TYPES_LIST.includes(type)) {
      throw new ApiError(
        400,
        `Invalid activity type. Allowed: ${ACTIVITY_TYPES_LIST.join(", ")}`,
      );
    }

    const { pageNum, limitNum, skip } = paginateQuery(req.query);

    // Admins can see private activities; others see public only
    const filter = { type };
    if (req.user.role !== "admin") {
      filter.isPublic = true;
    }

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate("user", "name profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Activity.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          activities,
          pagination: buildPaginationMeta(total, pageNum, limitNum),
          type,
        },
        `Activities of type "${type}" retrieved successfully`,
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/activity/:id ────────────────────────────────
export const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      throw new ApiError(404, "Activity not found");
    }

    // Only the activity owner or an admin can delete
    if (
      activity.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new ApiError(403, "You do not have permission to delete this activity");
    }

    await activity.deleteOne();

    res.status(200).json(new ApiResponse(200, null, "Activity deleted successfully"));
  } catch (error) {
    next(error);
  }
};
