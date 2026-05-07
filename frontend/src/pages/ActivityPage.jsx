import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import ActivityFeed from "../components/ActivityFeed";
import socket from "../socket/socket";
import { useEffect } from "react";

// ── Activity type filter options ────────────────────────────
const TYPE_OPTIONS = [
  { value: "", label: "All Activity" },
  { value: "bid_placed", label: "💰 Bids Placed" },
  { value: "auction_created", label: "🏷️ Auctions Created" },
  { value: "auction_started", label: "🔴 Auctions Started" },
  { value: "auction_ended", label: "🏁 Auctions Ended" },
  { value: "watchlist_added", label: "❤️ Watchlist Added" },
  { value: "watchlist_removed", label: "💔 Watchlist Removed" },
  { value: "seller_authorized", label: "✅ Seller Authorized" },
  { value: "auction_approved", label: "👍 Auction Approved" },
  { value: "auction_rejected", label: "👎 Auction Rejected" },
  { value: "user_joined_auction", label: "👀 Auction Joins" },
];

// ── TabButton ───────────────────────────────────────────────
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
      active
        ? "bg-indigo-600 text-white shadow-sm"
        : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
    }`}
  >
    {children}
  </button>
);

// ═══════════════════════════════════════════════════════════
const ActivityPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState("my");
  const [typeFilter, setTypeFilter] = useState("");

  // Build filters object — memoized so useActivity doesn't re-fetch on every render
  const filters = useMemo(
    () => ({ type: typeFilter }),
    [typeFilter],
  );

  // ── Join global feed socket room when on global tab ───────
  useEffect(() => {
    if (activeTab === "global") {
      socket.emit("joinGlobalFeed");
    }
    return () => {
      if (activeTab === "global") {
        socket.emit("leaveGlobalFeed");
      }
    };
  }, [activeTab]);

  // ── Reset type filter on tab switch ───────────────────────
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setTypeFilter("");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Activity Feed
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          A real-time log of your actions and system events.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <TabButton active={activeTab === "my"} onClick={() => handleTabSwitch("my")}>
          My Activity
        </TabButton>
        {/* Global feed: available to everyone (admins see private too) */}
        <TabButton
          active={activeTab === "global"}
          onClick={() => handleTabSwitch("global")}
        >
          {isAdmin ? "🌐 Global Feed" : "Global Feed"}
        </TabButton>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex-1 min-w-[180px]">
          <label
            htmlFor="type-filter"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            Filter by type
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {typeFilter && (
          <button
            onClick={() => setTypeFilter("")}
            className="self-end px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
          >
            Clear filter
          </button>
        )}

        {/* Live indicator */}
        <div className="self-end flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Feed */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6">
          <ActivityFeed feedType={activeTab} filters={filters} />
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
