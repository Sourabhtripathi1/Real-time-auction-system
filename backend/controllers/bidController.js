import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { paginateQuery, buildPaginationMeta } from "../utils/paginateQuery.js";
import { notifyOutbid } from "../services/notificationService.js";

const ANTI_SNIPE_THRESHOLD_MS = 10_000;
const ANTI_SNIPE_EXTENSION_MS = 10_000;

export const placeBid = async (req, res, next) => {
  try {
    const { auctionId, amount } = req.body;

    if (!auctionId || amount == null) {
      throw new ApiError(400, "Auction ID and bid amount are required");
    }

    const bidAmount = Number(amount);

    if (Number.isNaN(bidAmount) || bidAmount <= 0) {
      throw new ApiError(400, "Bid amount must be a positive number");
    }

    // ── Step a) Auction must exist ─────────────────────────
    const auction = await Auction.findById(auctionId);

    if (!auction) {
      throw new ApiError(404, "Auction not found");
    }

    // ── Step b) Must be active ─────────────────────────────
    if (auction.status !== "active") {
      throw new ApiError(
        400,
        `Auction is not active (current status: ${auction.status})`,
      );
    }

    // ── Step c) Within auction time window ─────────────────
    const now = Date.now();

    if (now < new Date(auction.startTime).getTime()) {
      throw new ApiError(400, "Auction has not started yet");
    }

    if (now > new Date(auction.endTime).getTime()) {
      throw new ApiError(400, "Auction has already ended");
    }

    // ── Step d) Seller cannot bid on own auction ───────────
    if (req.user._id.toString() === auction.seller.toString()) {
      throw new ApiError(403, "Seller cannot bid on their own auction");
    }

    // ── Step e) Blocked users cannot bid ───────────────────
    if (req.user.isBlocked) {
      throw new ApiError(403, "Your account has been blocked");
    }

    // ── Step f) Bid must exceed current highest bid ────────
    if (bidAmount <= auction.currentHighestBid) {
      throw new ApiError(
        400,
        `Bid must be higher than the current highest bid of ${auction.currentHighestBid}`,
      );
    }

    // ── Step g) Bid must respect minimum increment ─────────
    if (bidAmount < auction.currentHighestBid + auction.minIncrement) {
      throw new ApiError(
        400,
        `Bid must be at least ${auction.currentHighestBid + auction.minIncrement} (current bid + minimum increment of ${auction.minIncrement})`,
      );
    }

    // ── Atomic update with race-condition guard ────────────
    // findOneAndUpdate is a SINGLE atomic DB operation:
    // - The query conditions ARE the authoritative validation.
    // - If another bid was placed between our read and this write,
    //   currentHighestBid will have changed → this returns null → 409.
    // - The $expr check also enforces minIncrement atomically.
    const previousBid = auction.currentHighestBid;
    const previousHighestBidderId = auction.highestBidder;

    const updatedAuction = await Auction.findOneAndUpdate(
      {
        _id: auctionId,
        status: "active",
        // RACE CONDITION GUARD:
        // Only succeeds if currentHighestBid hasn't changed since we validated.
        // Another simultaneous bid will change this value, causing this to return null.
        currentHighestBid: { $lte: previousBid },
        // Also enforce minIncrement atomically in the DB operation
        $expr: {
          $gte: [
            bidAmount,
            { $add: ["$currentHighestBid", "$minIncrement"] },
          ],
        },
      },
      {
        $set: {
          currentHighestBid: bidAmount,
          highestBidder: req.user._id,
        },
      },
      { new: true, runValidators: true },
    );

    if (!updatedAuction) {
      // Re-fetch the current bid so the frontend can auto-fill
      const freshAuction = await Auction.findById(auctionId)
        .select("currentHighestBid minIncrement")
        .lean();

      return res.status(409).json({
        success: false,
        code: "BID_CONFLICT",
        message:
          "A higher bid was just placed. Please refresh and try again.",
        currentHighestBid: freshAuction?.currentHighestBid ?? previousBid,
        minIncrement: freshAuction?.minIncrement ?? auction.minIncrement,
      });
    }

    // ── Get io instance once ───────────────────────────────
    const io = req.app.get("io");

    // ── Anti-sniping: extend if bid placed in final 10s ────
    let sniped = false;

    const timeRemaining =
      new Date(updatedAuction.endTime).getTime() - Date.now();

    if (timeRemaining <= ANTI_SNIPE_THRESHOLD_MS) {
      const newEndTime = new Date(
        new Date(updatedAuction.endTime).getTime() + ANTI_SNIPE_EXTENSION_MS,
      );

      await Auction.findByIdAndUpdate(auctionId, {
        $set: { endTime: newEndTime },
      });

      sniped = true;

      // Emit timer extension to the auction room
      io.to(`auction_${auctionId}`).emit("timerExtended", {
        auctionId,
        newEndTime,
      });
    }

    // ── Save Bid document ──────────────────────────────────
    const bid = await Bid.create({
      auction: auctionId,
      bidder: req.user._id,
      amount: bidAmount,
      timestamp: new Date(),
    });

    // ── Socket: broadcast bid update ───────────────────────
    io.to(`auction_${auctionId}`).emit("bidUpdated", {
      auctionId,
      highestBid: bidAmount,
      highestBidder: { id: req.user._id, name: req.user.name },
      timestamp: bid.timestamp,
    });

    // ── Notify previous highest bidder they were outbid ─────
    if (
      previousHighestBidderId &&
      previousHighestBidderId.toString() !== req.user._id.toString()
    ) {
      notifyOutbid({
        bidderId: previousHighestBidderId,
        auctionId: auction._id,
        auctionTitle: auction.title,
        newBid: bidAmount,
        previousBid,
      }).catch((err) =>
        console.error("[Bid] Outbid notification failed:", err.message),
      );
    }

    // ── Response ───────────────────────────────────────────
    res.status(201).json(
      new ApiResponse(
        201,
        {
          bid,
          currentHighestBid: bidAmount,
          sniped,
        },
        sniped
          ? "Bid placed successfully — timer extended due to last-second bid"
          : "Bid placed successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getBidsByAuction = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    // Default to 20 bids per page (most recent first)
    // Uses compound index { auction: 1, timestamp: -1 } for O(log n) lookup
    const { pageNum, limitNum, skip } = paginateQuery({
      page: req.query.page,
      limit: req.query.limit || 20,
    });

    const [bids, total] = await Promise.all([
      Bid.find({ auction: auctionId })
        .populate("bidder", "name profileImage")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Bid.countDocuments({ auction: auctionId }),
    ]);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { bids, pagination: buildPaginationMeta(total, pageNum, limitNum) },
          "Bids retrieved successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ── GET /api/bids/my-bids (Bidder) ────────────────────────
export const getMyBids = async (req, res, next) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = req.query;
    const { pageNum, limitNum, skip } = paginateQuery(page, limit);

    const filter = { bidder: req.user._id };

    // Optional: filter bids by matching auction title
    if (search?.trim()) {
      const matchedAuctions = await Auction.find(
        { title: { $regex: search.trim(), $options: "i" } },
        "_id",
      ).lean();
      filter.auction = { $in: matchedAuctions.map((a) => a._id) };
    }

    // Whitelist sort fields
    const allowedSortFields = new Set(["timestamp", "amount"]);
    const safeSortField = allowedSortFields.has(sortBy) ? sortBy : "timestamp";
    const safeSortOrder = sortOrder === "asc" ? 1 : -1;
    const sort = { [safeSortField]: safeSortOrder };

    const [bids, total] = await Promise.all([
      Bid.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate("auction", "title status currentHighestBid endTime images")
        .lean(),
      Bid.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          bids,
          pagination: buildPaginationMeta(total, pageNum, limitNum),
        },
        "Your bids retrieved successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
