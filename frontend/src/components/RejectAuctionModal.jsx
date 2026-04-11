import { useState } from 'react';

const inputClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition resize-none";

const RejectAuctionModal = ({ auctionId, auctionTitle, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10) {
      setError('Rejection reason must be at least 10 characters.');
      return;
    }
    if (trimmedReason.length > 500) {
      setError('Rejection reason cannot exceed 500 characters.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onSubmit(auctionId, trimmedReason);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject auction.');
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-gray-950/60 border border-gray-200 dark:border-gray-800 w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reject Auction</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
            {auctionTitle}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span>Reason for Rejection <span className="text-red-500">*</span></span>
              <span className={`text-xs ${reason.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                {reason.length} / 500
              </span>
            </label>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Provide a clear reason why this auction is being rejected (min 10 characters)..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              className={`${inputClass} ${error ? 'border-red-300 dark:border-red-700 focus:ring-red-500' : ''}`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Rejecting
              </span>
            ) : (
              'Reject Auction'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectAuctionModal;
