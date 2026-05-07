import React, { memo } from "react";

// ── Activity type metadata ──────────────────────────────────
const ACTIVITY_META = {
  bid_placed: {
    icon: "💰",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  auction_created: {
    icon: "🏷️",
    bg: "bg-green-50 dark:bg-green-950/40",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  auction_started: {
    icon: "🔴",
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  auction_ended: {
    icon: "🏁",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  watchlist_added: {
    icon: "❤️",
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800",
  },
  watchlist_removed: {
    icon: "💔",
    bg: "bg-gray-50 dark:bg-gray-800/60",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
  },
  seller_authorized: {
    icon: "✅",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  auction_approved: {
    icon: "👍",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-800",
  },
  auction_rejected: {
    icon: "👎",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
  },
  user_joined_auction: {
    icon: "👀",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
};

// ── formatRelativeTime ──────────────────────────────────────
function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: d > 365 ? "numeric" : undefined,
  });
}

// ── ActivityItem ───────────────────────────────────────────
const ActivityItem = memo(({ activity }) => {
  const meta = ACTIVITY_META[activity.type] || ACTIVITY_META.auction_created;
  const user = activity.user;
  const initial = (user?.name || "?")[0].toUpperCase();
  const imgUrl = user?.profileImage?.url;

  return (
    <div
      className={`group flex gap-3 px-3 py-3 rounded-xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all duration-150 border-l-2 hover:border-l-indigo-400 dark:hover:border-l-indigo-500`}
    >
      {/* User Avatar */}
      <div className="flex-shrink-0 relative">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={user?.name}
            loading="lazy"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-900"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 items-center justify-center text-indigo-700 dark:text-indigo-400 font-semibold text-sm ring-2 ring-white dark:ring-gray-900 ${imgUrl ? "hidden" : "flex"}`}
        >
          {initial}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">
          <span className="font-semibold">{user?.name || "Unknown"}</span>{" "}
          <span className="text-gray-600 dark:text-gray-400">{activity.action}</span>
        </p>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {activity.metadata?.bidAmount != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs rounded-full font-medium">
              💰 ₹{Number(activity.metadata.bidAmount).toLocaleString("en-IN")}
            </span>
          )}
          {activity.metadata?.auctionTitle && activity.type !== "bid_placed" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full truncate max-w-[180px]">
              {activity.metadata.auctionTitle}
            </span>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatRelativeTime(activity.createdAt)}
        </p>
      </div>

      {/* Activity Type Icon */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${meta.bg} ${meta.text}`}
        title={activity.type.replace(/_/g, " ")}
      >
        {meta.icon}
      </div>
    </div>
  );
});

ActivityItem.displayName = "ActivityItem";

export default ActivityItem;
