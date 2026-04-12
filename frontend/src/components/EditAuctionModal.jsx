import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const inputClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

const toLocalDatetime = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const EditAuctionModal = ({ auction, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    basePrice: '',
    minIncrement: '',
    startTime: '',
    endTime: '',
  });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auction) {
      setForm({
        title: auction.title || '',
        description: auction.description || '',
        basePrice: auction.basePrice || '',
        minIncrement: auction.minIncrement || '',
        startTime: auction.startTime ? new Date(auction.startTime).toISOString().slice(0, 16) : '',
        endTime: auction.endTime ? new Date(auction.endTime).toISOString().slice(0, 16) : '',
      });
      setImages([]);
      setPreviewUrls([]);
    }
  }, [auction]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const validFiles = [];
    const newPreviewUrls = [];

    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Max 5MB.`);
        return;
      }
      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    }

    setImages(validFiles);
    setPreviewUrls(newPreviewUrls);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      await onSave(auction._id, fd, auction.status);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update auction');
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleClose = () => {
    previewUrls.forEach(URL.revokeObjectURL);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Auction</h2>
            {['pending', 'rejected'].includes(auction?.status) && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                ⚠ Saving will move this auction back to Inactive
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          <div>
            <label className={labelClass}>Title</label>
            <input name="title" required value={form.title} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea name="description" rows={3} value={form.description} onChange={handleChange} className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Base Price (₹)</label>
              <input name="basePrice" type="number" required min="0" value={form.basePrice} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Min Increment (₹)</label>
              <input name="minIncrement" type="number" required min="1" value={form.minIncrement} onChange={handleChange} className={inputClass} />
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
            <div className="flex items-center justify-between">
              <label className={labelClass}>Current Images</label>
            </div>
            {auction?.images?.length > 0 ? (
              <div className="mt-2 mb-4 grid grid-cols-5 gap-2">
                {auction.images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <img src={img.url} alt="current" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">No current images.</p>
            )}

            <label className={labelClass}>
              Replace Images (optional)
              <span className="font-normal text-amber-500 ml-2 text-xs">Uploading new images will replace ALL existing images</span>
            </label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleImageSelect}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-950/40 file:text-primary-700 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-950/60 transition"
            />
            {auction?.images?.length > 0 && images.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {auction.images.length} existing image(s) will be kept
              </p>
            )}
            
            {previewUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {previewUrls.map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20">
                    <img src={url} alt="preview" className="w-full h-full object-cover opacity-80" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAuctionModal;
