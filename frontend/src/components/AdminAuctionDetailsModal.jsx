import { useState } from 'react';
import { toast } from 'react-toastify';

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const inputClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition resize-none";

const AdminAuctionDetailsModal = ({ auction, onClose, onApprove, onReject, loading }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!auction) return null;

  // Handle click on backdrop to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleApproveClick = () => {
    onApprove(auction._id);
  };

  const handleRejectSubmit = () => {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10) {
      setError('Rejection reason must be at least 10 characters.');
      return;
    }
    if (trimmedReason.length > 500) {
      setError('Rejection reason cannot exceed 500 characters.');
      return;
    }
    setError('');
    onReject(auction._id, trimmedReason);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-gray-950/60 border border-gray-200 dark:border-gray-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="pr-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              Review Auction: {auction.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Submitted by <span className="font-medium text-gray-700 dark:text-gray-300">{auction.seller?.name || 'Unknown Seller'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Images */}
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Images</h3>
              {auction.images && auction.images.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
                  {auction.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={`Auction ${idx + 1}`}
                      className="w-full h-auto object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                    />
                  ))}
                </div>
              ) : (
                <div className="h-48 bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-gray-400 dark:text-gray-500 text-sm">No images provided</span>
                </div>
              )}
            </div>

            {/* Right Column: Details */}
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Base Price</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">₹{auction.basePrice?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Min Increment</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">₹{auction.minIncrement?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Start Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(auction.startTime)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">End Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(auction.endTime)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {auction.description}
              </p>
            </div>
          </div>
          
          {/* Reject Form Dropdown (Animated) */}
          <div className={`transition-all duration-300 overflow-hidden ${showRejectForm ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0 m-0'}`}>
            <div className="p-5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
              <label className="flex justify-between text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                <span>Reason for Rejection <span className="text-red-500">*</span></span>
                <span className={`text-xs ${reason.length > 500 ? 'text-red-600 font-bold' : 'text-red-500/70'}`}>
                  {reason.length} / 500
                </span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Provide a clear reason why this auction is being rejected..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                className={`${inputClass} mb-2 bg-white dark:bg-gray-800 border-red-200 dark:border-red-800/50 focus:ring-red-500/50`}
              />
              {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Rejecting</>
                  ) : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        {!showRejectForm && (
          <div className="px-6 py-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 sticky bottom-0 z-10">
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition disabled:opacity-50 shadow-sm"
            >
              Reject
            </button>
            <button
              onClick={handleApproveClick}
              disabled={loading}
              className="px-8 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Approving
                </span>
              ) : 'Approve'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuctionDetailsModal;
