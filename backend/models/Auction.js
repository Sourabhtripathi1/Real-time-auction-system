import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Auction title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "Cannot upload more than 10 images",
      },
      default: [],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Base price cannot be negative"],
    },
    currentHighestBid: {
      type: Number,
      default: null,
    },
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    minIncrement: {
      type: Number,
      required: [true, "Minimum bid increment is required"],
      min: [1, "Minimum increment must be at least 1"],
    },
    startTime: {
      type: Date,
      required: [true, "Auction start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "Auction end time is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["inactive", "pending", "approved", "active", "ended", "rejected"],
        message: "{VALUE} is not a valid auction status",
      },
      default: "inactive",
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ seller: 1, status: 1 });
auctionSchema.index({ startTime: 1 });

// ── Validation: endTime must be after startTime ────────────
auctionSchema.pre("validate", function () {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate("endTime", "End time must be after start time");
  }
});

// ── Default currentHighestBid to basePrice on creation ─────
auctionSchema.pre("save", function () {
  if (this.isNew && this.currentHighestBid == null) {
    this.currentHighestBid = this.basePrice;
  }
});

const Auction = mongoose.model("Auction", auctionSchema);

export default Auction;
