import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyWatchlist, removeFromWatchlist } from '../services/watchlistApi';

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  ended: 'bg-red-100 text-red-700',
};

const Watchlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyWatchlist();
        setItems(res.data || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleRemove = async (auctionId) => {
    setRemoving(auctionId);
    try {
      await removeFromWatchlist(auctionId);
      setItems((prev) => prev.filter((w) => w.auction?._id !== auctionId));
    } catch {
      /* silent */
    } finally {
      setRemoving(null);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Skeleton card
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="flex gap-2 mt-5">
        <div className="h-9 bg-gray-200 rounded-lg flex-1" />
        <div className="h-9 bg-gray-200 rounded-lg flex-1" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Watchlist</h1>
        <p className="mt-1 text-sm text-gray-500">
          Auctions you&apos;re tracking
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Your watchlist is empty</h2>
          <p className="text-gray-500 mb-6">Start browsing auctions and add items to your watchlist.</p>
          <button
            onClick={() => navigate('/auctions')}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
          >
            Browse Auctions
          </button>
        </div>
      )}

      {/* Cards */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const auction = item.auction;
            if (!auction) return null;

            return (
              <div
                key={item._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">
                      {auction.title}
                    </h3>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_STYLES[auction.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {auction.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Bid</span>
                      <span className="font-semibold text-gray-900">
                        ₹{auction.currentHighestBid?.toLocaleString() || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ends</span>
                      <span className="text-gray-700">{formatDate(auction.endTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => navigate(`/auction/${auction._id}`)}
                    className="flex-1 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition text-center"
                  >
                    Join Auction
                  </button>
                  <button
                    onClick={() => handleRemove(auction._id)}
                    disabled={removing === auction._id}
                    className="flex-1 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition text-center disabled:opacity-50"
                  >
                    {removing === auction._id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
