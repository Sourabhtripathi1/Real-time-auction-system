import Auction from "../models/Auction.js";
import AuctionMetrics from "../models/AuctionMetrics.js";

// @desc    Get performance metrics for a specific auction
// @route   GET /api/auctions/:id/metrics
// @access  Private (Any authenticated user)
export const getAuctionMetrics = async (req, res) => {
  try {
    const auctionId = req.params.id;

    // Verify auction exists
    const auction = await Auction.findById(auctionId).select("title status seller").lean();

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    // Get metrics
    const metrics = await AuctionMetrics.findOne({
      auction: auctionId,
    }).lean();

    if (!metrics) {
      // Metrics not yet calculated, generate them
      const newMetrics = await AuctionMetrics.updateMetricsForAuction(auctionId);

      return res.json({
        success: true,
        auction: {
          id: auction._id,
          title: auction.title,
          status: auction.status,
        },
        metrics: newMetrics,
      });
    }

    return res.json({
      success: true,
      auction: {
        id: auction._id,
        title: auction.title,
        status: auction.status,
      },
      metrics,
    });
  } catch (error) {
    console.error("Error in getAuctionMetrics:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get performance metrics for seller's auctions
// @route   GET /api/auctions/seller/performance
// @access  Private (Seller/Admin)
export const getSellerAuctionMetrics = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "seller") {
      filter.seller = req.user._id;
    }

    // Find recent 50 auctions for the seller (or all if admin)
    const auctions = await Auction.find(filter)
      .select("_id title status currentHighestBid")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get metrics for each auction
    const auctionMetrics = await Promise.all(
      auctions.map(async (auction) => {
        const metrics = await AuctionMetrics.findOne({
          auction: auction._id,
        }).lean();

        return {
          auction: {
            id: auction._id,
            title: auction.title,
            status: auction.status,
          },
          metrics: metrics || (await AuctionMetrics.updateMetricsForAuction(auction._id)),
        };
      })
    );

    return res.json({
      success: true,
      auctionMetrics,
    });
  } catch (error) {
    console.error("Error in getSellerAuctionMetrics:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
