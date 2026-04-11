import { useState } from 'react';

const inputClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

const CreateAuctionModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    basePrice: '',
    minIncrement: '',
    startTime: '',
    endTime: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      await onSave(fd);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create auction');
    } finally {
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-gray-950/60 border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Auction</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              New auctions are saved as drafts. Submit for review when ready.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Title</label>
            <input name="title" required value={form.title} onChange={handleChange} placeholder="e.g. Vintage Rolex Submariner" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea name="description" rows={3} value={form.description} onChange={handleChange} placeholder="Describe your item…" className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Base Price (₹)</label>
              <input name="basePrice" type="number" required min="0" value={form.basePrice} onChange={handleChange} placeholder="1000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Min Increment (₹)</label>
              <input name="minIncrement" type="number" required min="1" value={form.minIncrement} onChange={handleChange} placeholder="100" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Time</label>
              <input name="startTime" type="datetime-local" required value={form.startTime} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>End Time</label>
              <input name="endTime" type="datetime-local" required value={form.endTime} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages([...e.target.files])}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-950/40 file:text-primary-700 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-950/60 transition"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAuctionModal;
