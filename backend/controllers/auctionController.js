import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import Watchlist from '../models/Watchlist.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

// ── Create Auction (status: inactive) ──────────────────────
export const createAuction = async (req, res, next) => {
  try {
    const { title, description, basePrice, minIncrement, startTime, endTime } = req.body;
    const images = req.files ? req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    })) : [];

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
      status: 'inactive',
    });

    res.status(201).json(
      new ApiResponse(201, auction, 'Auction created as draft. Submit for verification when ready.')
    );
  } catch (error) {
    next(error);
  }
};

// ── Submit for Verification ────────────────────────────────
export const submitForVerification = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      throw new ApiError(404, 'Auction not found');
    }

    if (req.user._id.toString() !== auction.seller.toString()) {
      throw new ApiError(403, 'You can only submit your own auctions');
    }

    if (!['inactive', 'rejected'].includes(auction.status)) {
      throw new ApiError(400, 'Only inactive or rejected auctions can be submitted for verification');
    }

    auction.status = 'pending';
    await auction.save();

    res.status(200).json(
      new ApiResponse(200, auction, 'Auction submitted for admin review')
    );
  } catch (error) {
    next(error);
  }
};

// ── Update Auction ─────────────────────────────────────────
export const updateAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      throw new ApiError(404, 'Auction not found');
    }

    if (req.user._id.toString() !== auction.seller.toString()) {
      throw new ApiError(403, 'You can only edit your own auctions');
    }

    if (!['inactive', 'pending', 'rejected'].includes(auction.status)) {
      throw new ApiError(400, 'Active or ended auctions cannot be edited');
    }

    const previousStatus = auction.status;

    // Allowed fields only
    const { title, description, basePrice, minIncrement, startTime, endTime } = req.body;
    if (title !== undefined) auction.title = title;
    if (description !== undefined) auction.description = description;
    if (basePrice !== undefined) auction.basePrice = basePrice;
    if (minIncrement !== undefined) auction.minIncrement = minIncrement;
    if (startTime !== undefined) auction.startTime = startTime;
    if (endTime !== undefined) auction.endTime = endTime;

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      if (auction.images && auction.images.length > 0) {
        await Promise.all(auction.images.map(img => deleteFromCloudinary(img.publicId)));
      }
      auction.images = req.files.map(file => ({
        url: file.path,
        publicId: file.filename
      }));
    }

    // If was pending or rejected, reset to inactive
    if (['pending', 'rejected'].includes(previousStatus)) {
      auction.status = 'inactive';
    }

    await auction.save();

    const message = ['pending', 'rejected'].includes(previousStatus)
      ? 'Auction updated and moved back to inactive. Resubmit for verification.'
      : 'Auction updated successfully';

    res.status(200).json(new ApiResponse(200, auction, message));
  } catch (error) {
    next(error);
  }
};

// ── Delete Auction ─────────────────────────────────────────
export const deleteAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      throw new ApiError(404, 'Auction not found');
    }

    if (req.user._id.toString() !== auction.seller.toString()) {
      throw new ApiError(403, 'You can only delete your own auctions');
    }

    if (!['inactive', 'pending', 'rejected'].includes(auction.status)) {
      throw new ApiError(400, 'Active or ended auctions cannot be deleted');
    }

    // Cleanup associated documents and images
    if (auction.images && auction.images.length > 0) {
      await Promise.all(auction.images.map(img => deleteFromCloudinary(img.publicId)));
    }

    await Promise.all([
      Bid.deleteMany({ auction: auction._id }),
      Watchlist.deleteMany({ auction: auction._id }),
      Auction.findByIdAndDelete(auction._id),
    ]);

    res.status(200).json(new ApiResponse(200, null, 'Auction deleted successfully'));
  } catch (error) {
    next(error);
  }
};

// ── Get Live Auctions ──────────────────────────────────────
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

// ── Get Auction by ID ──────────────────────────────────────
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

// ── Approve / Reject Auction (Admin) ───────────────────────
export const approveAuction = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;

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

    if (action === 'approve') {
      auction.status = 'approved';
      auction.rejectionReason = null;
      auction.approvedBy = req.user._id;
    } else {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new ApiError(400, 'Rejection reason is required');
      }
      
      const trimmedReason = rejectionReason.trim();
      
      if (trimmedReason.length < 10) {
        throw new ApiError(400, 'Rejection reason must be at least 10 characters');
      }
      if (trimmedReason.length > 500) {
        throw new ApiError(400, 'Rejection reason cannot exceed 500 characters');
      }

      auction.status = 'rejected';
      auction.rejectionReason = trimmedReason;
      auction.approvedBy = req.user._id;
    }

    await auction.save();

    res.status(200).json(
      new ApiResponse(200, auction, `Auction successfully ${auction.status}`)
    );
  } catch (error) {
    next(error);
  }
};

// ── Get Pending Auctions (Admin) ───────────────────────────
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

// ── Get My Auctions (Seller) ───────────────────────────────
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
