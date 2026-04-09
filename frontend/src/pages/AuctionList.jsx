import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLiveAuctions } from '../services/auctionApi';

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  ended: 'bg-red-100 text-red-700',
  rejected: 'bg-gray-100 text-gray-500',
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
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

  // Initial fetch
  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchAuctions, 30_000);
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  const filtered = auctions.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch =
      !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Live Auctions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse and join active auctions in real time
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Auction ID</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Title</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Seller</th>
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Current Bid</th>
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Min Increment</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">End Time</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 font-medium">No auctions found</p>
                      <p className="text-gray-400 text-xs">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((auction) => (
                  <tr
                    key={auction._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">
                      {auction._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {auction.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {auction.seller?.name || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      ₹{auction.currentHighestBid?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      ₹{auction.minIncrement?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_STYLES[auction.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {auction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(auction.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/auction/${auction._id}`)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition"
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

      {/* Count footer */}
      {!loading && (
        <p className="mt-4 text-xs text-gray-400 text-right">
          Showing {filtered.length} of {auctions.length} auctions · Auto-refreshes every 30s
        </p>
      )}
    </div>
  );
};

export default AuctionList;
