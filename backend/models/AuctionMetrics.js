import mongoose from "mongoose";
import AuctionView from "./AuctionView.js";
import Bid from "./Bid.js";
import Auction from "./Auction.js";

const auctionMetricsSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      unique: true,
      index: true,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    uniqueViewers: {
      type: Number,
      default: 0,
    },
    totalBids: {
      type: Number,
      default: 0,
    },
    uniqueBidders: {
      type: Number,
      default: 0,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    avgBidAmount: {
      type: Number,
      default: 0,
    },
    maxBidAmount: {
      type: Number,
      default: 0,
    },
    minBidAmount: {
      type: Number,
      default: 0,
    },
    bidViewRatio: {
      type: Number,
      default: 0, // percentage 0-100
    },
    firstBidTime: {
      type: Number,
      default: null, // milliseconds from auction start to first bid
    },
    averageSessionDuration: {
      type: Number,
      default: 0, // seconds
    },
    viewsBySource: {
      search: { type: Number, default: 0 },
      watchlist: { type: Number, default: 0 },
      direct: { type: Number, default: 0 },
      homepage: { type: Number, default: 0 },
      recommendation: { type: Number, default: 0 },
    },
    bidsByHour: {
      type: [
        {
          hour: Number,
          count: Number,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Static method to update metrics for an auction
auctionMetricsSchema.statics.updateMetricsForAuction = async function (auctionId) {
  const [
    auction,
    views,
    bids,
    uniqueViewerIds,
    uniqueBidderIds,
    avgBidData,
    maxBidDoc,
    minBidDoc,
  ] = await Promise.all([
    Auction.findById(auctionId).lean(),
    AuctionView.countDocuments({ auction: auctionId }),
    Bid.countDocuments({ auction: auctionId }),
    AuctionView.distinct("user", { auction: auctionId }),
    Bid.distinct("bidder", { auction: auctionId }),
    Bid.aggregate([
      { $match: { auction: auctionId } },
      { $group: { _id: null, avg: { $avg: "$bidAmount" } } },
    ]),
    Bid.findOne({ auction: auctionId }).sort({ bidAmount: -1 }).select("bidAmount").lean(),
    Bid.findOne({ auction: auctionId }).sort({ bidAmount: 1 }).select("bidAmount").lean(),
  ]);

  if (!auction) return null;

  const uniqueViewCount = uniqueViewerIds.length;
  const uniqueBidCount = uniqueBidderIds.length;
  const avgBid = avgBidData[0]?.avg || 0;
  const maxBid = maxBidDoc?.bidAmount || 0;
  const minBid = minBidDoc?.bidAmount || 0;

  // Calculate first bid time
  const firstBid = await Bid.findOne({ auction: auctionId }).sort({ timestamp: 1 }).lean();
  const firstBidTime =
    firstBid && auction.startTime
      ? new Date(firstBid.timestamp).getTime() - new Date(auction.startTime).getTime()
      : null;

  // Calculate bid-view ratio
  const bidViewRatio = views > 0 ? ((bids / views) * 100).toFixed(2) : 0;

  // Group bids by hour
  const bidsByHour = await Bid.aggregate([
    { $match: { auction: auctionId } },
    {
      $group: {
        _id: { $hour: "$timestamp" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const bidsByHourArray = [];
  for (let h = 0; h < 24; h++) {
    const hourData = bidsByHour.find((b) => b._id === h);
    bidsByHourArray.push({
      hour: h,
      count: hourData?.count || 0,
    });
  }

  // Views by source
  const viewsBySourceData = await AuctionView.aggregate([
    { $match: { auction: auctionId } },
    { $group: { _id: "$source", count: { $sum: 1 } } },
  ]);

  const viewsBySource = {
    search: 0,
    watchlist: 0,
    direct: 0,
    homepage: 0,
    recommendation: 0,
  };

  viewsBySourceData.forEach((item) => {
    if (Object.prototype.hasOwnProperty.call(viewsBySource, item._id)) {
      viewsBySource[item._id] = item.count;
    }
  });

  // Average session duration
  const sessionData = await AuctionView.aggregate([
    { $match: { auction: auctionId } },
    { $group: { _id: null, avg: { $avg: "$sessionDuration" } } },
  ]);
  const averageSessionDuration = sessionData[0]?.avg || 0;

  // Upsert metrics
  const metrics = await this.findOneAndUpdate(
    { auction: auctionId },
    {
      auction: auctionId,
      totalViews: views,
      uniqueViewers: uniqueViewCount,
      totalBids: bids,
      uniqueBidders: uniqueBidCount,
      avgBidAmount: parseFloat(avgBid.toFixed(2)),
      maxBidAmount: maxBid,
      minBidAmount: minBid,
      bidViewRatio: parseFloat(bidViewRatio),
      firstBidTime,
      averageSessionDuration: parseFloat(averageSessionDuration.toFixed(2)),
      viewsBySource,
      bidsByHour: bidsByHourArray,
    },
    { upsert: true, new: true, lean: true }
  );

  return metrics;
};

const AuctionMetrics = mongoose.model("AuctionMetrics", auctionMetricsSchema);
export default AuctionMetrics;
