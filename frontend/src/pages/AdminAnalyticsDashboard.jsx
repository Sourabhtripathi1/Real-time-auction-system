import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getOverviewMetrics,
  getRevenueByDay,
  getAuctionsByStatus,
  getBidFrequency,
  getTopAuctions,
  getUserGrowth,
} from "../services/analyticsApi";

import OverviewCard from "../components/analytics/OverviewCard";
import ChartCard from "../components/analytics/ChartCard";
import RevenueChart from "../components/analytics/RevenueChart";
import StatusPieChart from "../components/analytics/StatusPieChart";
import BidFrequencyChart from "../components/analytics/BidFrequencyChart";
import UserGrowthChart from "../components/analytics/UserGrowthChart";
import TopAuctionsTable from "../components/analytics/TopAuctionsTable";

const AdminAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState(null);
  const [revenueByDay, setRevenueByDay] = useState([]);
  const [auctionsByStatus, setAuctionsByStatus] = useState({});
  const [bidFrequency, setBidFrequency] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [topAuctions, setTopAuctions] = useState([]);

  const fetchAnalytics = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    setError(null);

    try {
      const [
        overviewData,
        revenueData,
        statusData,
        bidData,
        topAuctionsData,
        userGrowthData,
      ] = await Promise.all([
        getOverviewMetrics(),
        getRevenueByDay(30),
        getAuctionsByStatus(),
        getBidFrequency(7),
        getTopAuctions(10),
        getUserGrowth(30),
      ]);

      setOverview(overviewData.data);
      setRevenueByDay(revenueData.data.revenueByDay);
      setAuctionsByStatus(statusData.data.byStatus);
      setBidFrequency(bidData.data.bidFrequency);
      setTopAuctions(topAuctionsData.data.topAuctions);
      setUserGrowth(userGrowthData.data.userGrowth);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      if (!isAutoRefresh) {
        setError(err.response?.data?.message || "Failed to load analytics");
      } else {
        toast.error("Failed to auto-refresh analytics");
      }
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Unable to Load Analytics
        </h2>
        <p className="text-red-500 max-w-md">{error}</p>
        <button
          onClick={() => fetchAnalytics()}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Platform performance and insights (auto-refreshes every 5m)
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <OverviewCard
          title="Total Revenue"
          value={`₹${overview.revenue.total.toLocaleString()}`}
          subtitle={`Avg: ₹${overview.revenue.average}`}
          icon="💰"
          color="green"
        />
        <OverviewCard
          title="Total Auctions"
          value={overview.auctions.total}
          subtitle={`${overview.auctions.completionRate}% completion rate`}
          icon="🏷️"
          color="blue"
        />
        <OverviewCard
          title="Total Bids"
          value={overview.bids.total}
          subtitle={`Avg ${overview.bids.avgPerAuction} per auction`}
          icon="💬"
          color="purple"
        />
        <OverviewCard
          title="Active Users"
          value={overview.users.active}
          subtitle={`${overview.users.newLast30Days} new this month`}
          icon="👥"
          color="indigo"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <ChartCard title="Revenue (Last 30 Days)">
          <RevenueChart data={revenueByDay} />
        </ChartCard>

        {/* Auctions by Status (Pie) */}
        <ChartCard title="Auctions by Status">
          <StatusPieChart data={auctionsByStatus} />
        </ChartCard>

        {/* Bid Frequency (Bar) */}
        <ChartCard title="Peak Bidding Hours">
          <BidFrequencyChart data={bidFrequency} />
        </ChartCard>

        {/* User Growth (Line) */}
        <ChartCard title="User Growth (Last 30 Days)">
          <UserGrowthChart data={userGrowth} />
        </ChartCard>
      </div>

      {/* Top Auctions Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top 10 Auctions by Revenue
          </h3>
        </div>
        <TopAuctionsTable auctions={topAuctions} />
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
