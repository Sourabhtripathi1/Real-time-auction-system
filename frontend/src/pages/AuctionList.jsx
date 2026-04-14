import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLiveAuctions } from '../services/auctionApi';
import { useSocket } from '../context/SocketContext';
import AuctionCard from '../components/AuctionCard';

// ── Filter Tabs ────────────────────────────────────────────
const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'ending', label: 'Ending Soon' },
  { key: 'upcoming', label: 'Upcoming' },
];

const SORT_OPTIONS = [
  { key: 'ending', label: 'Ending Soon' },
  { key: 'newest', label: 'Newest' },
  { key: 'lowest', label: 'Lowest Bid' },
  { key: 'highest', label: 'Highest Bid' },
];

// ── Skeleton Card ──────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/50 border border-gray-200/80 dark:border-gray-800 overflow-hidden animate-pulse">
    <div className="h-52 bg-gray-200 dark:bg-gray-800" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
      <div className="h-7 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mt-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/5" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl mt-3" />
    </div>
  </div>
);

// ── Refresh Icon ───────────────────────────────────────────
const RefreshIcon = ({ spinning }) => (
  <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ═══════════════════════════════════════════════════════════
// AUCTION LIST PAGE
// ═══════════════════════════════════════════════════════════
const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('ending');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Live bid overrides (auctionId -> { highestBid, ended })
  const liveUpdatesRef = useRef({});
  const [, forceRender] = useState(0);

  const navigate = useNavigate();
  const { socket } = useSocket();

  // ── Fetch ────────────────────────────────────────────────
  const fetchAuctions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getLiveAuctions();
      setAuctions(res.data || []);
      liveUpdatesRef.current = {};
      setError('');
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load auctions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  // Auto-refresh every 30s
  useEffect(() => {
    const iv = setInterval(() => fetchAuctions(true), 30_000);
    return () => clearInterval(iv);
  }, [fetchAuctions]);

  // "X seconds ago" counter
  useEffect(() => {
    if (!lastUpdated) return;
    const iv = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [lastUpdated]);

  // ── Real-time socket events ──────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onBidUpdated = ({ auctionId, highestBid }) => {
      if (!auctionId) return;
      liveUpdatesRef.current = {
        ...liveUpdatesRef.current,
        [auctionId]: { ...liveUpdatesRef.current[auctionId], highestBid },
      };
      forceRender((c) => c + 1);
    };

    const onAuctionEnded = ({ auctionId }) => {
      if (!auctionId) return;
      liveUpdatesRef.current = {
        ...liveUpdatesRef.current,
        [auctionId]: { ...liveUpdatesRef.current[auctionId], ended: true },
      };
      forceRender((c) => c + 1);
    };

    socket.on('bidUpdated', onBidUpdated);
    socket.on('auctionEnded', onAuctionEnded);

    return () => {
      socket.off('bidUpdated', onBidUpdated);
      socket.off('auctionEnded', onAuctionEnded);
    };
  }, [socket]);

  // ── Filter & Sort ────────────────────────────────────────
  const now = Date.now();
  const TEN_MIN = 10 * 60 * 1000;

  const filtered = auctions
    .filter((a) => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;

      const isLiveEnded = liveUpdatesRef.current[a._id]?.ended;
      const effectiveStatus = isLiveEnded ? 'ended' : a.status;
      const endMs = new Date(a.endTime).getTime();
      const endingSoon = effectiveStatus === 'active' && (endMs - now) <= TEN_MIN && (endMs - now) > 0;

      switch (activeTab) {
        case 'live': return effectiveStatus === 'active';
        case 'ending': return endingSoon;
        case 'upcoming': return effectiveStatus === 'approved' || effectiveStatus === 'pending';
        default: return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'ending': return new Date(a.endTime) - new Date(b.endTime);
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'lowest': return (a.currentHighestBid || a.basePrice) - (b.currentHighestBid || b.basePrice);
        case 'highest': return (b.currentHighestBid || b.basePrice) - (a.currentHighestBid || a.basePrice);
        default: return 0;
      }
    });

  const clearFilters = () => {
    setSearch('');
    setActiveTab('all');
    setSortBy('ending');
  };

  const inputBase = "px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition";

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Live Auctions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Loading...' : `${auctions.length} auction${auctions.length !== 1 ? 's' : ''} currently active`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {refreshing ? 'Refreshing...' : `Updated ${secondsAgo}s ago`}
            </span>
          )}
          <button
            onClick={() => fetchAuctions(true)}
            disabled={refreshing}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
            aria-label="Refresh auctions"
          >
            <RefreshIcon spinning={refreshing} />
          </button>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="sticky top-16 z-30 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-4 mb-6 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search auctions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputBase} w-full pl-10`}
            />
          </div>

          {/* Tab Pills */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`${inputBase} w-auto`}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">Failed to load auctions</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={() => fetchAuctions()}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton Grid */}
      {loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">No auctions found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or check back later</p>
              <button
                onClick={clearFilters}
                className="px-5 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-xl transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((auction) => {
                const live = liveUpdatesRef.current[auction._id];
                return (
                  <AuctionCard
                    key={auction._id}
                    auction={auction}
                    onJoin={(id) => navigate(`/auction/${id}`)}
                    currentHighestBid={live?.highestBid}
                    isEnded={live?.ended}
                  />
                );
              })}
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400 dark:text-gray-600 text-right">
            Showing {filtered.length} of {auctions.length} auctions · Auto-refreshes every 30s
          </p>
        </>
      )}
    </div>
  );
};

export default AuctionList;
