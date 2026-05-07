import React from "react";

const MetricBadge = ({ label, value, icon }) => {
  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center border border-indigo-100 dark:border-indigo-800">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide font-medium">
        {label}
      </p>
    </div>
  );
};

export default MetricBadge;
