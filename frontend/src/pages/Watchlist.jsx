import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyWatchlist, removeFromWatchlist } from "../services/watchlistApi";

const STATUS_STYLES = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  ended: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
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
    new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
      </div>
      <div className="flex gap-2 mt-5">
        <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-lg flex-1" />
        <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-lg flex-1" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Watchlist
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Auctions you&apos;re tracking
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Your watchlist is empty
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start browsing auctions and add items to your watchlist.
          </p>
          <button
            onClick={() => navigate("/auctions")}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition">
            Browse Auctions
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const auction = item.auction;
            if (!auction) return null;

            return (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between hover:shadow-md dark:hover:shadow-gray-900/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                      {auction.title}
                    </h3>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[auction.status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                      {auction.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Current Bid
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₹{auction.currentHighestBid?.toLocaleString() || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Ends
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDate(auction.endTime)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => navigate(`/auction/${auction._id}`)}
                    className="flex-1 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition text-center">
                    Join Auction
                  </button>
                  <button
                    onClick={() => handleRemove(auction._id)}
                    disabled={removing === auction._id}
                    className="flex-1 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-center disabled:opacity-50">
                    {removing === auction._id ? "Removing…" : "Remove"}
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
