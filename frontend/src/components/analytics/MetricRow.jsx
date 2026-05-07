import React from "react";

const MetricRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </span>
      <span className="font-bold text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  );
};

export default MetricRow;
