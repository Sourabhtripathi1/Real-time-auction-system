import mongoose from "mongoose";

const auctionViewSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auction",
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  sessionDuration: {
    type: Number,
    default: 0,
  },
  source: {
    type: String,
    enum: ["search", "watchlist", "direct", "homepage", "recommendation"],
    default: "direct",
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
});

// Indexes for fast lookups
auctionViewSchema.index({ auction: 1, user: 1, viewedAt: -1 });
auctionViewSchema.index({ auction: 1, viewedAt: -1 });
auctionViewSchema.index({ user: 1, viewedAt: -1 });

// Static method to record a unique view per day, accumulating duration
auctionViewSchema.statics.recordView = async function ({
  auctionId,
  userId,
  source = "direct",
  sessionDuration = 0,
  ipAddress = null,
  userAgent = null,
}) {
  if (!userId) return null;

  // Only record if user is bidder role
  const user = await mongoose.model("User").findById(userId).select("role").lean();
  if (user?.role !== "bidder") return null;

  // Check if user already viewed this auction today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingView = await this.findOne({
    auction: auctionId,
    user: userId,
    viewedAt: { $gte: today },
  });

  if (existingView) {
    existingView.sessionDuration += sessionDuration;
    await existingView.save();
    return existingView;
  }

  // Record new view
  return this.create({
    auction: auctionId,
    user: userId,
    source,
    sessionDuration,
    ipAddress,
    userAgent,
    viewedAt: new Date(),
  });
};

const AuctionView = mongoose.model("AuctionView", auctionViewSchema);
export default AuctionView;
