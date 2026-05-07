import { useMemo } from "react";
import useActivity from "../hooks/useActivity";
import ActivityItem from "./ActivityItem";

// ── Time group helpers ──────────────────────────────────────
function getGroupLabel(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6);

  if (date >= todayStart) return "Today";
  if (date >= yesterdayStart) return "Yesterday";
  if (date >= weekStart) return "This Week";
  return "Older";
}

const GROUP_ORDER = ["Today", "Yesterday", "This Week", "Older"];

// ── Skeleton ────────────────────────────────────────────────
const ActivitySkeleton = () => (
  <div className="flex gap-3 px-3 py-3 animate-pulse">
    <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
    </div>
    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
  </div>
);

// ── ActivityFeed ────────────────────────────────────────────
/**
 * Props:
 *  feedType  "my" | "global"
 *  filters   { type, startDate, endDate }
 */
const ActivityFeed = ({ feedType = "my", filters = {} }) => {
  const { activities, loading, error, hasMore, loadMore } = useActivity(
    feedType,
    filters,
  );

  // Group activities by time label
  const grouped = useMemo(() => {
    const map = {};
    for (const activity of activities) {
      const label = getGroupLabel(activity.createdAt);
      if (!map[label]) map[label] = [];
      map[label].push(activity);
    }
    // Return in logical order
    return GROUP_ORDER.filter((k) => map[k]).map((k) => ({
      label: k,
      items: map[k],
    }));
  }, [activities]);

  // ── Initial load skeleton ───────────────────────────────
  if (loading && activities.length === 0) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // ── Empty ───────────────────────────────────────────────
  if (!loading && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          No activity yet
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {feedType === "my"
            ? "Your actions will appear here."
            : "No public activity to show."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(({ label, items }) => (
        <div key={label}>
          {/* Group Header */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {label}
            </h3>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            <span className="text-xs text-gray-400 dark:text-gray-600">
              {items.length}
            </span>
          </div>

          {/* Activity Items */}
          <div className="space-y-0.5">
            {items.map((activity) => (
              <ActivityItem
                key={activity._id}
                activity={activity}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="pt-2 pb-1">
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      {/* Loading more indicator (at bottom when appending) */}
      {loading && activities.length > 0 && (
        <div className="space-y-1 pt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <ActivitySkeleton key={`more-${i}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
