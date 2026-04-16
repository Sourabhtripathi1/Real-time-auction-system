import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import Watchlist from "../models/Watchlist.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";

// ── Utility: update lastLogin (called from authController) ─
export const updateLastLogin = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  } catch {
    // Non-critical — do not throw
  }
};

// ── GET /api/profile/me ────────────────────────────────────
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) throw new ApiError(404, "User not found");

    let stats = {};

    if (user.role === "seller") {
      const [totalAuctions, activeAuctions, pendingAuctions] = await Promise.all([
        Auction.countDocuments({ seller: user._id }),
        Auction.countDocuments({ seller: user._id, status: "active" }),
        Auction.countDocuments({ seller: user._id, status: "pending" }),
      ]);
      stats = { totalAuctions, activeAuctions, pendingAuctions };
    }

    if (user.role === "bidder") {
      const [totalBids, auctionsWon, watchlistCount] = await Promise.all([
        Bid.countDocuments({ bidder: user._id }),
        Auction.countDocuments({ highestBidder: user._id, status: "ended" }),
        Watchlist.countDocuments({ user: user._id }),
      ]);
      stats = { totalBids, auctionsWon, watchlistCount };
    }

    res.status(200).json(
      new ApiResponse(200, { user, stats }, "Profile fetched successfully")
    );
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/profile/update ──────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name, contactNumber, address } = req.body;

    // Build update payload — only allow safe fields
    const updates = {};

    if (name !== undefined) {
      if (name.trim().length < 2 || name.trim().length > 50) {
        throw new ApiError(400, "Name must be between 2 and 50 characters");
      }
      updates.name = name.trim();
    }

    if (contactNumber !== undefined) {
      if (!/^[0-9]{10,15}$/.test(contactNumber)) {
        throw new ApiError(400, "Enter a valid contact number (10-15 digits)");
      }
      updates.contactNumber = contactNumber;
    }

    // Address sub-fields — merge safely
    if (address && typeof address === "object") {
      const allowedAddressFields = ["street", "city", "state", "pincode", "country"];
      for (const key of allowedAddressFields) {
        if (address[key] !== undefined) {
          updates[`address.${key}`] = address[key];
        }
      }
    }

    // Handle profile image upload
    if (req.file) {
      // Delete old profile image from Cloudinary
      const existing = await User.findById(req.user.id).select("profileImage");
      if (existing?.profileImage?.publicId) {
        await deleteFromCloudinary(existing.profileImage.publicId);
      }
      updates.profileImage = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) throw new ApiError(404, "User not found");

    res.status(200).json(
      new ApiResponse(200, { user: updatedUser }, "Profile updated successfully")
    );
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/profile/change-password ────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // a) All fields required
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new ApiError(400, "All password fields are required");
    }

    // b) Confirm match
    if (newPassword !== confirmPassword) {
      throw new ApiError(400, "New password and confirm password do not match");
    }

    // c) Min length
    if (newPassword.length < 8) {
      throw new ApiError(400, "New password must be at least 8 characters");
    }

    // d) Must differ from current
    if (newPassword === currentPassword) {
      throw new ApiError(400, "New password must be different from current password");
    }

    // e) Fetch with password (normally select: false)
    const user = await User.findById(req.user.id).select("+password");
    if (!user) throw new ApiError(404, "User not found");

    // f) Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new ApiError(401, "Current password is incorrect");

    // Hash new password and update directly (bypasses pre-save hook to avoid double-hashing)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    res.status(200).json(
      new ApiResponse(200, null, "Password changed successfully")
    );
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/profile/remove-image ──────────────────────
export const removeProfileImage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) throw new ApiError(404, "User not found");

    if (!user.profileImage?.url) {
      throw new ApiError(400, "No profile image to remove");
    }

    await deleteFromCloudinary(user.profileImage.publicId);

    user.profileImage = null;
    await user.save();

    res.status(200).json(
      new ApiResponse(200, { user }, "Profile image removed successfully")
    );
  } catch (err) {
    next(err);
  }
};
