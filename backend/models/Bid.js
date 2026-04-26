import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: [true, "Auction reference is required"],
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Bidder reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Bid amount is required"],
      min: [0, "Bid amount cannot be negative"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ────────────────────────────────────────────────
// Compound: getBidsByAuction → auction filter + sort by timestamp desc
bidSchema.index({ auction: 1, timestamp: -1 });

// Compound: getMyBids → bidder filter + sort by timestamp desc
bidSchema.index({ bidder: 1, timestamp: -1 });

// Compound: bid stats per auction (count, deduplication)
bidSchema.index({ auction: 1, bidder: 1 });

// Compound: auctionsWon check → bidder + highest amount
bidSchema.index({ bidder: 1, amount: -1 });

// Compound: highest bid per auction (quick lookup)
bidSchema.index({ auction: 1, amount: -1 });

const Bid = mongoose.model("Bid", bidSchema);

export default Bid;
