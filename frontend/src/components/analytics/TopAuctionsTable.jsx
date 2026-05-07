import React from "react";
import { Link } from "react-router-dom";

const TopAuctionsTable = ({ auctions }) => {
  if (!auctions || auctions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No ended auctions found.
      </div>
    );
  }

  const getDurationDays = (start, end) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-4 py-3 font-medium rounded-tl-lg">Rank</th>
            <th className="px-4 py-3 font-medium">Auction Title</th>
            <th className="px-4 py-3 font-medium">Seller</th>
            <th className="px-4 py-3 font-medium text-right">Revenue</th>
            <th className="px-4 py-3 font-medium text-center">Bids</th>
            <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {auctions.map((auction, index) => (
            <tr
              key={auction._id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs dark:bg-indigo-900/40 dark:text-indigo-400">
                  {index + 1}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                <Link
                  to={`/auction/${auction._id}`}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  {auction.title.length > 40
                    ? auction.title.substring(0, 40) + "..."
                    : auction.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {auction.seller?.name || "Unknown"}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-500">
                ₹{auction.currentHighestBid.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                  {auction.bidCount}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                {getDurationDays(auction.createdAt, auction.endTime)} days
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopAuctionsTable;
