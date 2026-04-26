import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import User from "../models/User.js";
import Watchlist from "../models/Watchlist.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";
import { validateUploadedFiles } from "../config/multer.js";
import { paginateQuery, buildPaginationMeta } from "../utils/paginateQuery.js";

// ── Allowed sort fields (whitelist to prevent injection) ───
const AUCTION_SORT_FIELDS = new Set([
  "createdAt",
  "endTime",
  "currentHighestBid",
  "basePrice",
]);
const AUCTION_STATUSES = new Set([
  "inactive",
  "pending",
  "approved",
  "active",
  "ended",
  "rejected",
]);

/**
 * Build a shared auction filter from common query params.
 * baseFiler is merged in first (e.g. { seller: id } or { status: 'pending' }).
 */
const buildAuctionFilter = (query, baseFilter = {}) => {
  const { search, status, startDate, endDate, minPrice, maxPrice } = query;
  const filter = { ...baseFilter };

  if (search?.trim()) {
    filter.title = { $regex: search.trim(), $options: "i" };
  }

  if (status && status !== "all" && AUCTION_STATUSES.has(status)) {
    filter.status = status;
  }

  if (startDate) {
    filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
  }
  if (endDate) {
    filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
  }

  if (minPrice != null && !Number.isNaN(Number(minPrice))) {
    filter.basePrice = { ...filter.basePrice, $gte: Number(minPrice) };
  }
  if (maxPrice != null && !Number.isNaN(Number(maxPrice))) {
    filter.basePrice = { ...filter.basePrice, $lte: Number(maxPrice) };
  }

  return filter;
};

/**
 * Build a safe sort object from query params.
 */
const buildSort = (sortBy, sortOrder, allowedFields = AUCTION_SORT_FIELDS) => {
  const field = allowedFields.has(sortBy) ? sortBy : "createdAt";
  const order = sortOrder === "asc" ? 1 : -1;
  return { [field]: order };
};

// ── Create Auction (status: inactive) ──────────────────────
export const createAuction = async (req, res, next) => {
  try {
    if (req.user.role === "seller") {
      const freshUser = await User.findById(req.user.id).select(
        "sellerStatus isBlocked",
      );
      if (!freshUser) throw new ApiError(404, "User not found");
      if (freshUser.isBlocked || freshUser.sellerStatus === "suspended") {
        throw new ApiError(
          403,
          "Your account has been suspended. Please contact support.",
        );
      }
      if (freshUser.sellerStatus !== "authorized") {
        throw new ApiError(
          403,
          "You must be an authorized seller to create auctions.",
        );
      }
    }

    const { basePrice, minIncrement } = req.body;
    let { title, description, startTime, endTime } = req.body;

    const images = req.files
      ? req.files.map((file) => ({
          url: file.path,
          publicId: file.filename,
        }))
      : [];

    if (!title || !basePrice || !minIncrement || !startTime || !endTime) {
      throw new ApiError(400, "Please provide all required fields");
    }

    try {
      // Validate Cloudinary confirmed these are real images
      await validateUploadedFiles(req.files);
    } catch (validationError) {
      if (req.files?.length > 0) {
        await Promise.allSettled(
          req.files.map((f) => deleteFromCloudinary(f.filename)),
        );
      }
      throw new ApiError(400, validationError.message);
    }

    // ── Validate auction dates ──
    const now = new Date();
    const stTime = new Date(startTime);
    const edTime = new Date(endTime);

    if (isNaN(stTime.getTime())) throw new ApiError(400, "Invalid start time format.");
    if (isNaN(edTime.getTime())) throw new ApiError(400, "Invalid end time format.");
    if (stTime < now) throw new ApiError(400, "Start time cannot be in the past.");
    if (edTime <= stTime) throw new ApiError(400, "End time must be after start time.");
    if (edTime - stTime < 5 * 60 * 1000) {
      throw new ApiError(400, "Auction must run for at least 5 minutes.");
    }

    // ── Sanitize text inputs ──
    const sanitize = (str) => str?.trim().replace(/<[^>]*>/g, "") || "";
    title = sanitize(title);
    description = sanitize(description);

    if (title.length < 5 || title.length > 100) {
      throw new ApiError(400, "Title must be 5–100 characters.");
    }

    const auction = await Auction.create({
      title,
      description,
      basePrice,
      currentHighestBid: basePrice,
      minIncrement,
      startTime: stTime,
      endTime: edTime,
      seller: req.user.id,
      images,
      status: "inactive",
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          auction,
          "Auction created as draft. Submit for verification when ready.",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ── Submit for Verification ────────────────────────────────
export const submitForVerification = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) throw new ApiError(404, "Auction not found");

    if (req.user._id.toString() !== auction.seller.toString()) {
      throw new ApiError(403, "You can only submit your own auctions");
    }

    if (!["inactive", "rejected"].includes(auction.status)) {
      throw new ApiError(
        400,
        "Only inactive or rejected auctions can be submitted for verification",
      );
    }

    auction.status = "pending";
    await auction.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, auction, "Auction submitted for admin review"),
      );
  } catch (error) {
    next(error);
  }
};

// ── Update Auction ─────────────────────────────────────────
export const updateAuction = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { title, description, basePrice, minIncrement, startTime, endTime } =
      req.body;

    const auction = await Auction.findById(id);

    if (!auction) {
      throw new ApiError(404, "Auction not found");
    }

    if (auction.seller.toString() !== req.user.id) {
      throw new ApiError(403, "Not authorized to update this auction");
    }

    if (auction.status !== "inactive" && auction.status !== "rejected") {
      throw new ApiError(400, "Only inactive or rejected auctions can be updated");
    }

    try {
      await validateUploadedFiles(req.files);
    } catch (validationError) {
      if (req.files?.length > 0) {
        await Promise.allSettled(
          req.files.map((f) => deleteFromCloudinary(f.filename)),
        );
      }
      throw new ApiError(400, validationError.message);
    }

    const now = new Date();
    if (startTime || endTime) {
      const stTime = startTime ? new Date(startTime) : new Date(auction.startTime);
      const edTime = endTime ? new Date(endTime) : new Date(auction.endTime);

      if (isNaN(stTime.getTime())) throw new ApiError(400, "Invalid start time format.");
      if (isNaN(edTime.getTime())) throw new ApiError(400, "Invalid end time format.");
      if (startTime && stTime < now) throw new ApiError(400, "Start time cannot be in the past.");
      if (edTime <= stTime) throw new ApiError(400, "End time must be after start time.");
      if (edTime - stTime < 5 * 60 * 1000) {
        throw new ApiError(400, "Auction must run for at least 5 minutes.");
      }
      
      if (startTime) auction.startTime = stTime;
      if (endTime) auction.endTime = edTime;
    }

    const sanitize = (str) => str?.trim().replace(/<[^>]*>/g, "") || "";
    if (title !== undefined) {
      title = sanitize(title);
      if (title.length < 5 || title.length > 100) {
        throw new ApiError(400, "Title must be 5–100 characters.");
      }
      auction.title = title;
    }
    
    if (description !== undefined) {
      auction.description = sanitize(description);
    }

    if (basePrice !== undefined) {
      auction.basePrice = basePrice;
      auction.currentHighestBid = basePrice;
    }
    if (minIncrement !== undefined) auction.minIncrement = minIncrement;

    if (req.files && req.files.length > 0) {
      if (auction.images?.length > 0) {
        await Promise.all(
          auction.images.map((img) => deleteFromCloudinary(img.publicId)),
        );
      }
      auction.images = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    if (["pending", "rejected"].includes(previousStatus)) {
      auction.status = "inactive";
    }

    await auction.save();

    const message = ["pending", "rejected"].includes(previousStatus)
      ? "Auction updated and moved back to inactive. Resubmit for verification."
      : "Auction updated successfully";

    res.status(200).json(new ApiResponse(200, auction, message));
  } catch (error) {
    next(error);
  }
};

// ── Delete Auction ─────────────────────────────────────────
export const deleteAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) throw new ApiError(404, "Auction not found");

    if (req.user._id.toString() !== auction.seller.toString()) {
      throw new ApiError(403, "You can only delete your own auctions");
    }

    if (!["inactive", "pending", "rejected"].includes(auction.status)) {
      throw new ApiError(400, "Active or ended auctions cannot be deleted");
    }

    if (auction.images?.length > 0) {
      await Promise.all(
        auction.images.map((img) => deleteFromCloudinary(img.publicId)),
      );
    }

    await Promise.all([
      Bid.deleteMany({ auction: auction._id }),
      Watchlist.deleteMany({ auction: auction._id }),
      Auction.findByIdAndDelete(auction._id),
    ]);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Auction deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// ── Get Live Auctions (Bidder) ───────────────────────────────────
export const getLiveAuctions = async (req, res, next) => {
  try {
    // Filter: status="active" AND endTime > now (truly live only)
    // Uses compound index { status: 1, endTime: 1 } for O(log n) scan
    // .lean() returns plain JS objects: ~3-5x faster, less memory vs Documents
    const auctions = await Auction.find({
      status: "active",
      endTime: { $gt: new Date() },
    })
      .populate("seller", "name profileImage")
      .populate("highestBidder", "name profileImage")
      .sort({ endTime: 1 })
      .lean();

    res
      .status(200)
      .json(
        new ApiResponse(200, auctions, "Live auctions retrieved successfully"),
      );
  } catch (error) {
    next(error);
  }
};

// ── Get Auction by ID ─────────────────────────────────────────
export const getAuctionById = async (req, res, next) => {
  try {
    // .lean() for read-only detail page — saves Mongoose Document overhead
    const auction = await Auction.findById(req.params.id)
      .populate("seller", "name email profileImage")
      .populate("highestBidder", "name profileImage")
      .lean();

    if (!auction) throw new ApiError(404, "Auction not found");

    res
      .status(200)
      .json(
        new ApiResponse(200, auction, "Auction details retrieved successfully"),
      );
  } catch (error) {
    next(error);
  }
};

// ── Approve / Reject Auction (Admin) ───────────────────────
export const approveAuction = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;

    if (!["approve", "reject"].includes(action)) {
      throw new ApiError(400, 'Invalid action. Must be "approve" or "reject"');
    }

    const auction = await Auction.findById(req.params.id);
    if (!auction) throw new ApiError(404, "Auction not found");

    if (auction.status !== "pending") {
      throw new ApiError(
        400,
        `Cannot ${action} auction that is already ${auction.status}`,
      );
    }

    if (action === "approve") {
      auction.status = "approved";
      auction.rejectionReason = null;
      auction.approvedBy = req.user._id;
    } else {
      if (!rejectionReason?.trim()) {
        throw new ApiError(400, "Rejection reason is required");
      }
      const trimmedReason = rejectionReason.trim();
      if (trimmedReason.length < 10)
        throw new ApiError(
          400,
          "Rejection reason must be at least 10 characters",
        );
      if (trimmedReason.length > 500)
        throw new ApiError(
          400,
          "Rejection reason cannot exceed 500 characters",
        );

      auction.status = "rejected";
      auction.rejectionReason = trimmedReason;
      auction.approvedBy = req.user._id;
    }

    await auction.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, auction, `Auction successfully ${auction.status}`),
      );
  } catch (error) {
    next(error);
  }
};

// ── Get Pending Auctions (Admin) — with search/filter/pagination ──
export const getPendingAuctions = async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;
    const { pageNum, limitNum, skip } = paginateQuery(page, limit);

    const filter = buildAuctionFilter(req.query, { status: "pending" });
    const sort = buildSort(sortBy, sortOrder);

    const [auctions, total] = await Promise.all([
      Auction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate("seller", "name email profileImage")
        .lean(),
      Auction.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          auctions,
          pagination: buildPaginationMeta(total, pageNum, limitNum),
        },
        "Pending auctions retrieved successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ── Get All Auctions (Admin) — NEW ─────────────────────────
export const getAllAuctions = async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, seller: sellerParam } = req.query;
    const { pageNum, limitNum, skip } = paginateQuery(page, limit);

    const filter = buildAuctionFilter(req.query);

    // Filter by seller name (partial match across users)
    if (sellerParam?.trim()) {
      const matchedSellers = await User.find(
        { name: { $regex: sellerParam.trim(), $options: "i" }, role: "seller" },
        "_id",
      ).lean();
      filter.seller = { $in: matchedSellers.map((s) => s._id) };
    }

    const sort = buildSort(sortBy, sortOrder);

    const [
      [auctions, total],
      totalAll,
      totalInactive,
      totalPending,
      totalApproved,
      totalActive,
      totalEnded,
      totalRejected,
    ] = await Promise.all([
      Promise.all([
        Auction.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .populate("seller", "name email profileImage")
          .populate("highestBidder", "name")
          .lean(),
        Auction.countDocuments(filter),
      ]),
      Auction.countDocuments({}),
      Auction.countDocuments({ status: "inactive" }),
      Auction.countDocuments({ status: "pending" }),
      Auction.countDocuments({ status: "approved" }),
      Auction.countDocuments({ status: "active" }),
      Auction.countDocuments({ status: "ended" }),
      Auction.countDocuments({ status: "rejected" }),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          auctions,
          pagination: buildPaginationMeta(total, pageNum, limitNum),
          summary: {
            total: totalAll,
            inactive: totalInactive,
            pending: totalPending,
            approved: totalApproved,
            active: totalActive,
            ended: totalEnded,
            rejected: totalRejected,
          },
        },
        "All auctions retrieved successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ── Get My Auctions (Seller) — with search/filter/pagination ─
export const getMyAuctions = async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;
    const { pageNum, limitNum, skip } = paginateQuery(page, limit);

    const filter = buildAuctionFilter(req.query, { seller: req.user._id });
    const sort = buildSort(sortBy, sortOrder);

    const sellerBase = { seller: req.user._id };

    const [
      [auctions, total],
      totalCount,
      inactiveCount,
      pendingCount,
      activeCount,
      rejectedCount,
      endedCount,
    ] = await Promise.all([
      Promise.all([
        Auction.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .populate("highestBidder", "name")
          .lean(),
        Auction.countDocuments(filter),
      ]),
      // Summary counts always against full seller dataset (unfiltered)
      Auction.countDocuments(sellerBase),
      Auction.countDocuments({ ...sellerBase, status: "inactive" }),
      Auction.countDocuments({ ...sellerBase, status: "pending" }),
      Auction.countDocuments({ ...sellerBase, status: "active" }),
      Auction.countDocuments({ ...sellerBase, status: "rejected" }),
      Auction.countDocuments({ ...sellerBase, status: "ended" }),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          auctions,
          pagination: buildPaginationMeta(total, pageNum, limitNum),
          summary: {
            total: totalCount,
            inactive: inactiveCount,
            pending: pendingCount,
            active: activeCount,
            rejected: rejectedCount,
            ended: endedCount,
          },
        },
        "Your auctions retrieved successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
