import Watchlist from "../models/Watchlist.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const addToWatchlist = async (req, res, next) => {
  try {
    const { auctionId } = req.body;

    if (!auctionId) {
      throw new ApiError(400, "Auction ID is required");
    }

    const existingEntry = await Watchlist.findOne({
      user: req.user._id,
      auction: auctionId,
    });

    if (existingEntry) {
      throw new ApiError(409, "Auction is already in your watchlist");
    }

    const watchlistItem = await Watchlist.create({
      user: req.user._id,
      auction: auctionId,
    });

    res
      .status(201)
      .json(
        new ApiResponse(201, watchlistItem, "Added to watchlist successfully"),
      );
  } catch (error) {
    // Also catch MongoDB duplicate key error if somehow concurrent requests bypass the findOne
    if (error.code === 11000) {
      return next(new ApiError(409, "Auction is already in your watchlist"));
    }
    next(error);
  }
};

export const getMyWatchlist = async (req, res, next) => {
  try {
    const watchlist = await Watchlist.find({ user: req.user._id })
      .populate("auction", "title currentHighestBid endTime status")
      .sort({ addedAt: -1 });

    res
      .status(200)
      .json(
        new ApiResponse(200, watchlist, "Watchlist retrieved successfully"),
      );
  } catch (error) {
    next(error);
  }
};

export const removeFromWatchlist = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const result = await Watchlist.findOneAndDelete({
      user: req.user._id,
      auction: auctionId,
    });

    if (!result) {
      throw new ApiError(404, "Item not found in watchlist");
    }

    res
      .status(200)
      .json(new ApiResponse(200, null, "Removed from watchlist successfully"));
  } catch (error) {
    next(error);
  }
};
