import Auction from '../models/Auction.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createAuction = async (req, res, next) => {
  try {
    const {
      title,
      description,
      images,
      basePrice,
      minIncrement,
      startTime,
      endTime,
    } = req.body;

    if (!title || !basePrice || !minIncrement || !startTime || !endTime) {
      throw new ApiError(400, 'Please provide all required fields');
    }

    const auction = await Auction.create({
      title,
      description,
      images,
      basePrice,
      minIncrement,
      startTime,
      endTime,
      seller: req.user._id,
      status: 'pending',
    });

    res.status(201).json(
      new ApiResponse(201, auction, 'Auction created successfully and is pending approval')
    );
  } catch (error) {
    next(error);
  }
};

export const getLiveAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.find({ status: 'active' })
      .populate('seller', 'name')
      .sort({ endTime: 1 });

    res.status(200).json(
      new ApiResponse(200, auctions, 'Live auctions retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

export const getAuctionById = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('highestBidder', 'name');

    if (!auction) {
      throw new ApiError(404, 'Auction not found');
    }

    res.status(200).json(
      new ApiResponse(200, auction, 'Auction details retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

export const approveAuction = async (req, res, next) => {
  try {
    const { action } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      throw new ApiError(400, 'Invalid action. Must be "approve" or "reject"');
    }

    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      throw new ApiError(404, 'Auction not found');
    }

    if (auction.status !== 'pending') {
      throw new ApiError(400, `Cannot ${action} auction that is already ${auction.status}`);
    }

    auction.status = action === 'approve' ? 'approved' : 'rejected';
    auction.approvedBy = req.user._id;
    
    await auction.save();

    res.status(200).json(
      new ApiResponse(200, auction, `Auction successfully ${auction.status}`)
    );
  } catch (error) {
    next(error);
  }
};

export const getPendingAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.find({ status: 'pending' })
      .populate('seller', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(200, auctions, 'Pending auctions retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

export const getMyAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.find({ seller: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(200, auctions, 'Your auctions retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};
