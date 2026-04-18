import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { submitSellerApplication } from "../../services/sellerAuthApi";

const BUSINESS_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "small_business", label: "Small Business" },
  { value: "company", label: "Company" },
  { value: "other", label: "Other" },
];

const SellerApplicationModal = ({
  isOpen,
  onClose,
  mode = "apply",
  existingData = {},
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    website: "",
    description: "",
    socialLinks: {
      instagram: "",
      facebook: "",
      twitter: "",
    },
  });

  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "reapply" || mode === "view") {
        setFormData({
          businessName: existingData?.sellerProfile?.businessName || "",
          businessType: existingData?.sellerProfile?.businessType || "",
          website: existingData?.sellerProfile?.website || "",
          description: existingData?.sellerProfile?.description || "",
          socialLinks: {
            instagram:
              existingData?.sellerProfile?.socialLinks?.instagram || "",
            facebook: existingData?.sellerProfile?.socialLinks?.facebook || "",
            twitter: existingData?.sellerProfile?.socialLinks?.twitter || "",
          },
        });
      } else {
        setFormData({
          businessName: "",
          businessType: "",
          website: "",
          description: "",
          socialLinks: { instagram: "", facebook: "", twitter: "" },
        });
      }
      setStep(1);
      setConfirmAccuracy(false);
      setAgreeTerms(false);
    }
  }, [isOpen, mode, existingData]);

  const handleClose = () => {
    if (isView || step === 1) return onClose();
    if (
      window.confirm(
        "Your application is not submitted yet. Are you sure you want to close?",
      )
    ) {
      onClose();
    }
  };

  // Press ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const isView = mode === "view";

  const handleNext = () => {
    if (step === 1) {
      if (!formData.businessName.trim())
        return toast.error("Business Name is required");
      if (!formData.businessType)
        return toast.error("Business Type is required");
      if (formData.website && !formData.website.match(/^https?:\/\//)) {
        return toast.error("Website must start with http:// or https://");
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.description.trim() || formData.description.length < 30) {
        return toast.error("Description must be at least 30 characters");
      }
      if (formData.description.length > 500) {
        return toast.error("Description cannot exceed 500 characters");
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (isView) return onClose();
    if (!confirmAccuracy || !agreeTerms)
      return toast.error("Please agree to the checkboxes");

    setLoading(true);
    try {
      await submitSellerApplication(formData);
      toast.success(
        "✅ Application submitted successfully! Awaiting admin review.",
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit application",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    if (step === 1) return "Business Info";
    if (step === 2) return "About You";
    return "Review & Submit";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === "apply"
              ? "Apply for Seller Authorization"
              : mode === "reapply"
                ? "Reapply for Authorization"
                : "Your Application"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step === num
                      ? "bg-indigo-600 text-white"
                      : step > num
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                  }`}>
                  {num}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            {getStepTitle()}
          </p>
        </div>

        {/* Body Content */}
        <div className="px-6 py-4 overflow-y-auto min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  disabled={isView}
                  placeholder="Your name or business name"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Type *
                </label>
                <select
                  disabled={isView}
                  value={formData.businessType}
                  onChange={(e) =>
                    setFormData({ ...formData, businessType: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800/50">
                  <option value="" disabled>
                    Select a type
                  </option>
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value}>
                      {bt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  disabled={isView}
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800/50"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  What do you plan to sell? *
                </label>
                <textarea
                  disabled={isView}
                  rows={4}
                  placeholder="Describe what kind of items you plan to auction (e.g., electronics, art, collectibles...)"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800/50"
                />
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-xs text-gray-500">Min 30 chars</span>
                  <span
                    className={`text-xs ${formData.description.length > 500 ? "text-red-500" : "text-gray-500"}`}>
                    {formData.description.length} / 500
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Social Links (Optional)
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    disabled={isView}
                    placeholder="Instagram handle (@username)"
                    value={formData.socialLinks.instagram}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: {
                          ...formData.socialLinks,
                          instagram: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white disabled:opacity-60 disabled:bg-gray-50"
                  />
                  <input
                    type="text"
                    disabled={isView}
                    placeholder="Facebook profile URL"
                    value={formData.socialLinks.facebook}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: {
                          ...formData.socialLinks,
                          facebook: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white disabled:opacity-60 disabled:bg-gray-50"
                  />
                  <input
                    type="text"
                    disabled={isView}
                    placeholder="Twitter/X handle (@username)"
                    value={formData.socialLinks.twitter}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: {
                          ...formData.socialLinks,
                          twitter: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white disabled:opacity-60 disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Business Name:
                  </span>{" "}
                  <span className="font-medium text-gray-900 dark:text-white break-all">
                    {formData.businessName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Type:
                  </span>{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {BUSINESS_TYPES.find(
                      (b) => b.value === formData.businessType,
                    )?.label || formData.businessType}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Website:
                  </span>{" "}
                  <span className="font-medium text-gray-900 dark:text-white break-all">
                    {formData.website || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">
                    Description:
                  </span>
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 max-h-24 overflow-y-auto">
                    {formData.description}
                  </div>
                </div>
              </div>

              {mode === "reapply" && existingData?.sellerStatusReason && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800/50 dark:text-yellow-400">
                  <p className="font-semibold text-xs mb-1">
                    ℹ️ Previous rejection reason:
                  </p>
                  <p className="text-sm">{existingData.sellerStatusReason}</p>
                  <p className="text-xs italic mt-2 opacity-80">
                    Please ensure you have addressed the above issue.
                  </p>
                </div>
              )}

              {!isView && (
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmAccuracy}
                      onChange={(e) => setConfirmAccuracy(e.target.checked)}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      I confirm all provided information is accurate
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      I agree to the platform's seller terms of service
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between gap-3 shrink-0 bg-gray-50 dark:bg-gray-800/20 rounded-b-3xl">
          {step > 1 && !isView ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white transition">
              ← Back
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white transition">
              {isView ? "Close" : "Cancel"}
            </button>
          )}

          {!isView && step < 3 && (
            <button
              onClick={handleNext}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm ml-auto">
              Next →
            </button>
          )}

          {!isView && step === 3 && (
            <button
              onClick={handleSubmit}
              disabled={loading || !confirmAccuracy || !agreeTerms}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ml-auto">
              {loading && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              )}
              {mode === "reapply"
                ? "Resubmit Application"
                : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerApplicationModal;
