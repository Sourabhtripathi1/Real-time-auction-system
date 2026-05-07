import React from "react";

const ActiveBiddersChip = ({ bidders = [], count = 0 }) => {
  if (count === 0) return null;

  const maxVisible = 3;
  const visibleBidders = bidders.slice(0, maxVisible);
  const remainingCount = count - maxVisible;

  let text = `Active: ${visibleBidders.join(", ")}`;
  if (remainingCount > 0) {
    text += `, +${remainingCount} more`;
  }

  const tooltipText = bidders.join(", ");

  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium"
      title={tooltipText}
    >
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="truncate max-w-[200px] sm:max-w-xs">{text}</span>
    </div>
  );
};

export default ActiveBiddersChip;
