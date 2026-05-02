import User from "../models/User.js";
import Auction from "../models/Auction.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { paginateQuery, buildPaginationMeta } from "../utils/paginateQuery.js";
import { notifySellerStatusChange } from "../services/notificationService.js";

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "sellerAppliedAt", "name"]);

// ── POST /api/seller/apply ──────────────────────────────────
export const submitSellerApplication = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found");

    const { sellerStatus } = user;

    if (sellerStatus === "authorized") {
      throw new ApiError(400, "Your seller account is already authorized");
    }
    if (sellerStatus === "pending_review") {
      throw new ApiError(400, "Your application is already under review");
    }
    if (sellerStatus === "suspended") {
      throw new ApiError(
        403,
        "Your account is suspended. Contact support for assistance.",
      );
    }

    const { businessName, businessType, description, website, socialLinks } =
      req.body;

    // Merge — only override fields that are actually provided
    const updatedProfile = {
      ...(user.sellerProfile?.toObject?.() || user.sellerProfile || {}),
    };
    if (businessName !== undefined)
      updatedProfile.businessName = businessName.trim();
    if (businessType !== undefined) updatedProfile.businessType = businessType;
    if (description !== undefined)
      updatedProfile.description = description.trim();
    if (website !== undefined) updatedProfile.website = website.trim();
    if (socialLinks !== undefined) {
      updatedProfile.socialLinks = {
        ...(updatedProfile.socialLinks || {}),
        ...(socialLinks.instagram !== undefined && {
          instagram: socialLinks.instagram,
        }),
        ...(socialLinks.facebook !== undefined && {
          facebook: socialLinks.facebook,
        }),
        ...(socialLinks.twitter !== undefined && {
          twitter: socialLinks.twitter,
        }),
      };
    }

    await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          sellerProfile: updatedProfile,
          sellerStatus: "pending_review",
          sellerAppliedAt: new Date(),
          sellerStatusReason: null,
        },
      },
      { runValidators: true },
    );

    const updated = await User.findById(req.user.id).select("-password");

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updated,
          "Application submitted. Await admin review.",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ── GET /api/seller/my-status ───────────────────────────────
export const getMySellerStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select(
        "sellerStatus sellerStatusReason sellerAppliedAt sellerStatusUpdatedAt sellerProfile role",
      )
      .lean({ virtuals: true })
      .populate("sellerStatusUpdatedBy", "name");

    if (!user) throw new ApiError(404, "User not found");

    res.status(200).json(
      new ApiResponse(
        200,
        {
          sellerStatus: user.sellerStatus,
          sellerStatusReason: user.sellerStatusReason,
          sellerAppliedAt: user.sellerAppliedAt,
          sellerStatusUpdatedAt: user.sellerStatusUpdatedAt,
          sellerProfile: user.sellerProfile,
          isAuthorizedSeller:
            user.role === "seller" && user.sellerStatus === "authorized",
        },
        "Seller status retrieved",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ── GET /api/seller/all (Admin) ─────────────────────────────
export const getAllSellers = async (req, res, next) => {
  try {
    const { page, limit, search, sellerStatus, sortBy, sortOrder } = req.query;
    const { pageNum, limitNum, skip } = paginateQuery(page, limit);

    // Build filter
    const filter = { role: "seller" };

    if (search?.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (sellerStatus && sellerStatus !== "all") {
      filter.sellerStatus = sellerStatus;
    }

    // Validate sort
    const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy)
      ? sortBy
      : "sellerAppliedAt";
    const safeSortOrder = sortOrder === "asc" ? 1 : -1;
    const sort = { [safeSortBy]: safeSortOrder };

    const [
      [sellers, total],
      totalSellers,
      unverifiedCount,
      pendingCount,
      authorizedCount,
      rejectedCount,
      suspendedCount,
    ] = await Promise.all([
      Promise.all([
        User.find(filter)
          .select("-password")
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .populate("sellerStatusUpdatedBy", "name")
          .lean(),
        User.countDocuments(filter),
      ]),
      User.countDocuments({ role: "seller" }),
      User.countDocuments({ role: "seller", sellerStatus: "unverified" }),
      User.countDocuments({ role: "seller", sellerStatus: "pending_review" }),
      User.countDocuments({ role: "seller", sellerStatus: "authorized" }),
      User.countDocuments({ role: "seller", sellerStatus: "rejected" }),
      User.countDocuments({ role: "seller", sellerStatus: "suspended" }),
    ]);

    // Attach auctionStats per seller
    const sellerIds = sellers.map((s) => s._id);
    const auctionStats = sellerIds.length
      ? await Auction.aggregate([
          { $match: { seller: { $in: sellerIds } } },
          {
            $group: {
              _id: "$seller",
              total: { $sum: 1 },
              active: {
                $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
              },
              ended: { $sum: { $cond: [{ $eq: ["$status", "ended"] }, 1, 0] } },
            },
          },
        ])
      : [];

    const statsMap = Object.fromEntries(
      auctionStats.map((s) => [s._id.toString(), s]),
    );

    const enrichedSellers = sellers.map((s) => ({
      ...s,
      auctionStats: statsMap[s._id.toString()] || {
        total: 0,
        active: 0,
        ended: 0,
      },
    }));

    res.status(200).json(
      new ApiResponse(
        200,
        {
          sellers: enrichedSellers,
          pagination: buildPaginationMeta(total, pageNum, limitNum),
          summary: {
            total: totalSellers,
            unverified: unverifiedCount,
            pending: pendingCount,
            authorized: authorizedCount,
            rejected: rejectedCount,
            suspended: suspendedCount,
          },
        },
        "Sellers retrieved successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/seller/:sellerId/status (Admin) ──────────────
export const updateSellerStatus = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { action, reason } = req.body;

    // Guard: admin cannot target themselves
    if (sellerId === req.user.id) {
      throw new ApiError(400, "You cannot update your own seller status");
    }

    const seller = await User.findById(sellerId);
    if (!seller) throw new ApiError(404, "Seller not found");
    if (seller.role !== "seller")
      throw new ApiError(400, "Target user is not a seller");

    const ALLOWED_ACTIONS = ["authorize", "reject", "suspend", "revoke"];
    if (!ALLOWED_ACTIONS.includes(action)) {
      throw new ApiError(
        400,
        `Invalid action. Allowed: ${ALLOWED_ACTIONS.join(", ")}`,
      );
    }

    // Reason required for reject and suspend
    if (["reject", "suspend"].includes(action)) {
      if (!reason?.trim()) {
        throw new ApiError(400, "Reason is required for reject/suspend");
      }
      const trimmed = reason.trim();
      if (trimmed.length < 10)
        throw new ApiError(400, "Reason must be at least 10 characters");
      if (trimmed.length > 500)
        throw new ApiError(400, "Reason cannot exceed 500 characters");
    }

    const now = new Date();
    const updatedBy = req.user.id;
    const updateDoc = {
      sellerStatusUpdatedAt: now,
      sellerStatusUpdatedBy: updatedBy,
    };

    switch (action) {
      case "authorize":
        updateDoc.sellerStatus = "authorized";
        updateDoc.sellerStatusReason = null;
        break;

      case "reject":
        updateDoc.sellerStatus = "rejected";
        updateDoc.sellerStatusReason = reason.trim();
        break;

      case "suspend":
        updateDoc.sellerStatus = "suspended";
        updateDoc.sellerStatusReason = reason.trim();
        updateDoc.isBlocked = true; // Blocks all app activity
        break;

      case "revoke":
        updateDoc.sellerStatus = "unverified";
        updateDoc.sellerStatusReason = reason?.trim() || null;
        updateDoc.isBlocked = false; // Unblock if previously suspended
        break;
    }

    const updated = await User.findByIdAndUpdate(
      sellerId,
      { $set: updateDoc },
      { new: true, runValidators: true },
    )
      .select("-password")
      .populate("sellerStatusUpdatedBy", "name");

    const actionVerb = {
      authorize: "authorized",
      reject: "rejected",
      suspend: "suspended",
      revoke: "revoked",
    }[action];

    // ── Notify seller about status change ────────────────────
    if (["authorize", "reject", "suspend"].includes(action)) {
      notifySellerStatusChange({
        sellerId: seller._id,
        status: actionVerb,
        reason: reason?.trim() || null,
      }).catch((err) =>
        console.error("[Seller] Status notification failed:", err.message),
      );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updated,
          `Seller account ${actionVerb} successfully`,
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ── GET /api/seller/:sellerId (Admin) ───────────────────────
export const getSellerById = async (req, res, next) => {
  try {
    const seller = await User.findById(req.params.sellerId)
      .select("-password")
      .populate("sellerStatusUpdatedBy", "name");

    if (!seller) throw new ApiError(404, "Seller not found");
    if (seller.role !== "seller")
      throw new ApiError(400, "Target user is not a seller");

    // Auction stats
    const [auctionStatsArr, recentAuctions] = await Promise.all([
      Auction.aggregate([
        { $match: { seller: seller._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            ended: { $sum: { $cond: [{ $eq: ["$status", "ended"] }, 1, 0] } },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
          },
        },
      ]),
      Auction.find({ seller: seller._id })
        .select("title status createdAt currentHighestBid")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const auctionStats = auctionStatsArr[0] || {
      total: 0,
      active: 0,
      pending: 0,
      ended: 0,
      rejected: 0,
    };
    delete auctionStats._id;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          seller: seller.toObject({ virtuals: true }),
          auctionStats,
          recentAuctions,
        },
        "Seller details retrieved successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
