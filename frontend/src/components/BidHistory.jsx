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

const BidHistory = ({ bids = [], currentUserId }) => {
  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">No bids yet — be the first!</p>
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 pr-1">
      {bids.map((bid, idx) => {
        const isMe = bid.bidder?._id === currentUserId || bid.bidder === currentUserId;
        const isLatest = idx === 0;

        return (
          <div
            key={bid._id || idx}
            className={`flex items-center justify-between py-2.5 px-2 rounded-lg transition-all duration-300
              ${isLatest ? 'opacity-100 translate-y-0' : 'opacity-90'}
              ${isMe ? 'bg-primary-50' : 'hover:bg-gray-50'}
            `}
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* Avatar placeholder */}
              <div
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${isMe ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                {(bid.bidder?.name || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <span
                  className={`block text-sm font-medium truncate ${
                    isMe ? 'text-primary-700' : 'text-gray-800'
                  }`}
                >
                  {isMe ? 'You' : bid.bidder?.name || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-400">
                  {formatRelative(bid.timestamp)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-3">
              {isLatest && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Top
                </span>
              )}
              <span className={`text-sm font-bold ${isMe ? 'text-primary-700' : 'text-gray-900'}`}>
                ₹{bid.amount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BidHistory;
