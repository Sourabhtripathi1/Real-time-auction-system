import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateSellerStatus } from "../../services/sellerAuthApi";

const SellerStatusActionModal = ({
  isOpen,
  onClose,
  action,
  sellerName,
  sellerId,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  // Press ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isReasonRequired = action === "reject" || action === "suspend";

  const handleSubmit = async () => {
    if (isReasonRequired) {
      if (!reason.trim()) {
        return setError("Reason is required for this action");
      }
      if (reason.trim().length < 10) {
        return setError("Reason must be at least 10 characters");
      }
      if (reason.trim().length > 500) {
        return setError("Reason cannot exceed 500 characters");
      }
    }
    setError("");

    setLoading(true);
    try {
      const { data: updatedSeller } = await updateSellerStatus(sellerId, {
        action,
        reason,
      });
      setLoading(false);

      let message = "Seller status updated";
      if (action === "reject") message = "❌ Seller application rejected";
      if (action === "suspend") message = "⚠️ Seller account suspended";
      if (action === "revoke") message = "🔄 Seller authorization revoked";

      toast.success(message);
      onSuccess(updatedSeller);
      onClose();
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || `Failed to ${action} seller`;
      setError(msg);
      toast.error(msg);
    }
  };

  const getActionConfig = () => {
    switch (action) {
      case "reject":
        return {
          title: "Reject Seller Application",
          color: "red",
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-800",
          warningText:
            "Rejecting will notify the seller of the reason and allow them to reapply.",
          btnColor: "bg-red-600 hover:bg-red-700",
          btnText: "Reject Application",
        };
      case "suspend":
        return {
          title: "Suspend Seller Account",
          color: "orange",
          bg: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-800",
          warningText:
            "Suspending will block this seller from ALL activity on the platform.",
          btnColor: "bg-orange-600 hover:bg-orange-700",
          btnText: "Suspend Account",
        };
      case "revoke":
        return {
          title: "Revoke Seller Authorization",
          color: "yellow",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-800",
          warningText:
            "Revoking will move this seller back to unverified status.",
          btnColor: "bg-yellow-600 hover:bg-yellow-700",
          btnText: "Revoke Authorization",
        };
      default:
        return {};
    }
  };

  const config = getActionConfig();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {config.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Action for:{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {sellerName}
            </span>
          </p>
        </div>

        <div className="p-6">
          <div
            className={`${config.bg} ${config.border} border rounded-xl p-4 mb-5`}>
            <p
              className={`text-sm ${config.text} font-medium flex items-start gap-2`}>
              <span className="shrink-0 mt-0.5">⚠️</span>
              {config.warningText}
            </p>
          </div>

          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason {isReasonRequired ? "*" : "(optional)"}
              </label>
              <span
                className={`text-xs ${reason.length > 500 ? "text-red-500" : "text-gray-500"}`}>
                {reason.length} / 500
              </span>
            </div>

            <textarea
              rows={4}
              placeholder={`Provide a reason for ${action === "reject" ? "rejection" : action === "suspend" ? "suspension" : "revocation"}...`}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-${config.color}-500 resize-none ${error ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 dark:border-gray-700"}`}
            />
            {error && (
              <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3 bg-gray-50 dark:bg-gray-800/20 rounded-b-3xl">
          <button
            onClick={onClose}
            className="w-1/3 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition">
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-2/3 px-4 py-2.5 text-sm font-medium text-white ${config.btnColor} rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex flex-1 items-center justify-center gap-2`}>
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            )}
            {config.btnText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerStatusActionModal;
