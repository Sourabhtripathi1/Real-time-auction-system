import { useState, memo } from "react";

// ── Helpers ────────────────────────────────────────────────
const formatRelative = (timestamp) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(timestamp).toLocaleDateString();
};

// ── Mini Avatar ────────────────────────────────────────────
const MiniAvatar = ({ user, isMe }) => {
  const [imgError, setImgError] = useState(false);
  const imgUrl = user?.profileImage?.url;
  const initial = (user?.name || "U")[0].toUpperCase();

  if (imgUrl && !imgError) {
    return (
      <img
        src={imgUrl}
        alt={user?.name}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        className="shrink-0 w-7 h-7 rounded-full object-cover ring-1 ring-white dark:ring-gray-900"
      />
    );
  }

  return (
    <div
      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white dark:ring-gray-900 ${
        isMe
          ? "bg-indigo-600 dark:bg-indigo-500 text-white"
          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
      }`}>
      {initial}
    </div>
  );
};

// ── BidHistory ─────────────────────────────────────────────
const BidHistory = ({ bids = [], currentUserId, hasMoreBids, onLoadMore, loadingMore }) => {
  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-600">
        <svg
          className="w-10 h-10 mb-2 opacity-40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-sm">No bids yet — be the first!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 pr-1">
        {bids.map((bid, idx) => {
          const isMe =
            bid.bidder?._id === currentUserId || bid.bidder === currentUserId;
          const isLatest = idx === 0;

          return (
            <div
              key={bid._id || idx}
              className={`flex items-center justify-between py-2.5 px-2 rounded-lg transition-all duration-300 ${
                isMe
                  ? "bg-indigo-50 dark:bg-indigo-950/40"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}>
              <div className="flex items-center gap-2 min-w-0">
                <MiniAvatar user={bid.bidder} isMe={isMe} />
                <div className="min-w-0">
                  <span
                    className={`block text-sm font-medium truncate ${isMe ? "text-indigo-700 dark:text-indigo-400" : "text-gray-800 dark:text-gray-200"}`}>
                    {isMe ? "You" : bid.bidder?.name || "Anonymous"}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatRelative(bid.timestamp)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-3">
                {isLatest && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                    Top
                  </span>
                )}
                <span
                  className={`text-sm font-bold ${isMe ? "text-indigo-700 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                  ₹{bid.amount?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Older Bids */}
      {hasMoreBids && (
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full mt-2 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loadingMore ? (
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              Loading...
            </span>
          ) : (
            "Load older bids"
          )}
        </button>
      )}
    </div>
  );
};

// React.memo: only re-render when bids array length changes or
// hasMoreBids/loadingMore flag changes. New bids arrive via socket
// and are prepended to the existing array, so length always changes on update.
export default memo(BidHistory, (prev, next) => {
  return (
    prev.bids.length === next.bids.length &&
    prev.hasMoreBids === next.hasMoreBids &&
    prev.loadingMore === next.loadingMore &&
    prev.currentUserId === next.currentUserId
  );
});
