import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";

// ── Overview Metrics ─────────────────────────────────────────
export const getOverviewMetrics = async (req, res, next) => {
  try {
    const [
      totalRevenue,
      totalAuctions,
      totalBids,
      activeUsers,
      totalUsers,
      pendingSellers,
      endedAuctions,
      auctionsWithBids,
      newUsersLast30Days,
    ] = await Promise.all([
      // Total revenue — sum of currentHighestBid for all ended auctions with a winner
      Auction.aggregate([
        { $match: { status: "ended", highestBidder: { $ne: null } } },
        { $group: { _id: null, total: { $sum: "$currentHighestBid" } } },
      ]).then((res) => res[0]?.total || 0),

      // Total auctions
      Auction.countDocuments(),

      // Total bids
      Bid.countDocuments(),

      // Active users (created activity in last 30 days)
      Activity.distinct("user", {
        createdAt: { $gte: new Date(Date.now() - 30 * 86400000) },
      }).then((ids) => ids.length),

      // Total registered users
      User.countDocuments(),

      // Pending seller applications
      User.countDocuments({
        role: "seller",
        sellerStatus: "pending_review",
      }),

      // Ended auctions count
      Auction.countDocuments({ status: "ended" }),

      // Auctions that received at least one bid
      Auction.countDocuments({ highestBidder: { $ne: null } }),

      // New users in last 30 days
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 86400000) },
      }),
    ]);

    // Calculate derived metrics
    const avgBidsPerAuction =
      totalAuctions > 0 ? (totalBids / totalAuctions).toFixed(2) : 0;

    const completionRate =
      endedAuctions > 0 ? ((auctionsWithBids / endedAuctions) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          average: totalAuctions > 0 ? (totalRevenue / totalAuctions).toFixed(2) : 0,
        },
        auctions: {
          total: totalAuctions,
          ended: endedAuctions,
          completionRate: parseFloat(completionRate),
        },
        bids: {
          total: totalBids,
          avgPerAuction: parseFloat(avgBidsPerAuction),
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          newLast30Days: newUsersLast30Days,
          pendingSellers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Revenue By Day ───────────────────────────────────────────
export const getRevenueByDay = async (req, res, next) => {
  try {
    const daysAgo = Math.min(parseInt(req.query.days) || 30, 90);
    const startDate = new Date(Date.now() - daysAgo * 86400000);

    const revenueByDay = await Auction.aggregate([
      {
        $match: {
          status: "ended",
          highestBidder: { $ne: null },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$currentHighestBid" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing dates with 0
    const result = [];
    for (let i = daysAgo; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      const dayData = revenueByDay.find((d) => d._id === date);

      result.push({
        date,
        revenue: dayData?.revenue || 0,
        count: dayData?.count || 0,
      });
    }

    res.status(200).json({ success: true, data: { revenueByDay: result } });
  } catch (error) {
    next(error);
  }
};

// ── Auctions By Status ───────────────────────────────────────
export const getAuctionsByStatus = async (req, res, next) => {
  try {
    const statusCounts = await Auction.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Transform to object
    const byStatus = {};
    statusCounts.forEach((item) => {
      byStatus[item._id] = item.count;
    });

    // Ensure all statuses represented (even if 0)
    const statuses = ["inactive", "pending", "approved", "active", "ended", "rejected"];
    statuses.forEach((s) => {
      if (!byStatus[s]) byStatus[s] = 0;
    });

    res.status(200).json({ success: true, data: { byStatus } });
  } catch (error) {
    next(error);
  }
};

// ── Bid Frequency ────────────────────────────────────────────
export const getBidFrequency = async (req, res, next) => {
  try {
    const daysAgo = Math.min(parseInt(req.query.days) || 7, 30);
    const startDate = new Date(Date.now() - daysAgo * 86400000);

    const bidsByHour = await Bid.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $hour: "$timestamp" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill all 24 hours (0-23)
    const result = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = bidsByHour.find((b) => b._id === hour);
      result.push({
        hour,
        count: hourData?.count || 0,
      });
    }

    res.status(200).json({ success: true, data: { bidFrequency: result } });
  } catch (error) {
    next(error);
  }
};

// ── Top Auctions ─────────────────────────────────────────────
export const getTopAuctions = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const topAuctions = await Auction.find({
      status: "ended",
      highestBidder: { $ne: null },
    })
      .sort({ currentHighestBid: -1 })
      .limit(limit)
      .select("title currentHighestBid seller createdAt endTime")
      .populate("seller", "name")
      .populate("highestBidder", "name")
      .lean();

    // Add bid count for each
    for (const auction of topAuctions) {
      auction.bidCount = await Bid.countDocuments({
        auction: auction._id,
      });
    }

    res.status(200).json({ success: true, data: { topAuctions } });
  } catch (error) {
    next(error);
  }
};

// ── User Growth ──────────────────────────────────────────────
export const getUserGrowth = async (req, res, next) => {
  try {
    const daysAgo = Math.min(parseInt(req.query.days) || 30, 365);
    const startDate = new Date(Date.now() - daysAgo * 86400000);

    const usersByDay = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing dates
    const result = [];
    for (let i = daysAgo; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      const dayData = usersByDay.find((d) => d._id === date);

      result.push({
        date,
        count: dayData?.count || 0,
      });
    }

    res.status(200).json({ success: true, data: { userGrowth: result } });
  } catch (error) {
    next(error);
  }
};
