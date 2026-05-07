import React from "react";

const FunnelChart = ({ data }) => {
  const max = Math.max(data.views, 1); // Avoid division by zero

  const bidsWidth = Math.max((data.bids / max) * 100, 2);
  const winnerWidth = Math.max((data.winner / max) * 100, 1);

  return (
    <div className="space-y-5 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
        Conversion Funnel
      </h4>

      {/* Views */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Views</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {data.views.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-blue-100 dark:bg-blue-900/30 h-4 rounded-full overflow-hidden">
          <div className="bg-blue-500 h-full rounded-full w-full transition-all duration-1000" />
        </div>
      </div>

      {/* Bids */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bids</span>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            {data.bids.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-green-100 dark:bg-green-900/30 h-4 rounded-full overflow-hidden relative">
          <div
            className="bg-green-500 h-full rounded-full transition-all duration-1000"
            style={{ width: `${bidsWidth}%` }}
          />
        </div>
      </div>

      {/* Winner */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Winner</span>
          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
            {data.winner.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-purple-100 dark:bg-purple-900/30 h-4 rounded-full overflow-hidden relative">
          <div
            className="bg-purple-500 h-full rounded-full transition-all duration-1000"
            style={{ width: `${winnerWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default FunnelChart;
