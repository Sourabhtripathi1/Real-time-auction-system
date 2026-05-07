import React from "react";
import MetricBadge from "./MetricBadge";
import MetricRow from "./MetricRow";
import FunnelChart from "./FunnelChart";

const AuctionMetricsPanel = ({ metrics, auctionStatus }) => {
  if (!metrics) return null;

  const formatDuration = (ms) => {
    if (!ms) return "—";
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const peakHour = metrics.bidsByHour
    ? Math.max(...metrics.bidsByHour.map((h) => h.count))
    : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      {/* Section 1: Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBadge label="Views" value={metrics.totalViews || 0} icon="👁️" />
        <MetricBadge label="Unique Viewers" value={metrics.uniqueViewers || 0} icon="👥" />
        <MetricBadge label="Bids" value={metrics.totalBids || 0} icon="💬" />
        <MetricBadge label="Bidders" value={metrics.uniqueBidders || 0} icon="🤝" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Section 2: Conversion Funnel */}
        <div className="lg:col-span-1">
          <FunnelChart
            data={{
              views: metrics.totalViews || 0,
              bids: metrics.totalBids || 0,
              winner: auctionStatus === "ended" && metrics.totalBids > 0 ? 1 : 0,
            }}
          />
        </div>

        {/* Section 3: Performance Metrics */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
          <MetricRow
            label="Bid-to-View Ratio"
            value={`${(metrics.bidViewRatio || 0).toFixed(1)}%`}
          />
          <MetricRow
            label="Average Bid"
            value={`₹${(metrics.avgBidAmount || 0).toLocaleString()}`}
          />
          <MetricRow
            label="Highest Bid"
            value={`₹${(metrics.maxBidAmount || 0).toLocaleString()}`}
          />
          <MetricRow
            label="Average Session"
            value={`${(metrics.averageSessionDuration || 0).toFixed(0)}s`}
          />
          <MetricRow label="Peak Bids/Hour" value={peakHour} />
          <MetricRow
            label="Time to 1st Bid"
            value={formatDuration(metrics.firstBidTime)}
          />
        </div>
      </div>
    </div>
  );
};

export default AuctionMetricsPanel;
