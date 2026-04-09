import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLiveAuctions } from '../services/auctionApi';

const STATUS_STYLES = {
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  ended:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  rejected: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
      </td>
    ))}
  </tr>
);

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchAuctions = useCallback(async () => {
    try {
      const res = await getLiveAuctions();
      setAuctions(res.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);
  useEffect(() => {
    const interval = setInterval(fetchAuctions, 30_000);
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  const filtered = auctions.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const inputBase = "px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Auctions</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Browse and join active auctions in real time</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`flex-1 ${inputBase}`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputBase}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                {['Auction ID', 'Title', 'Seller', 'Current Bid', 'Min Increment', 'Status', 'End Time', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No auctions found</p>
                      <p className="text-gray-400 dark:text-gray-600 text-xs">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((auction) => (
                  <tr key={auction._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-gray-600 whitespace-nowrap">
                      {auction._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                      {auction.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{auction.seller?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      ₹{auction.currentHighestBid?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      ₹{auction.minIncrement?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[auction.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {auction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(auction.endTime)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/auction/${auction._id}`)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition shadow-sm"
                      >
                        Join Auction
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && (
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-600 text-right">
          Showing {filtered.length} of {auctions.length} auctions · Auto-refreshes every 30s
        </p>
      )}
    </div>
  );
};

export default AuctionList;
