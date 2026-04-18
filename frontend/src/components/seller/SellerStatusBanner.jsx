import React from "react";

const timeAgo = (d) => {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const SellerStatusBanner = ({
  sellerStatus,
  sellerStatusReason,
  sellerAppliedAt,
  onApplyClick,
  onReapplyClick,
  onViewClick,
}) => {
  if (sellerStatus === "unverified") {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11V7a4 4 0 018 0v4c0 2.404-.6 4.67-1.666 6.671L12 21.05m-3.44-2.04h.01M16 11h.01"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Seller Verification Required
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              You need admin authorization before you can create and manage
              auctions. Submit your seller profile for review.
            </p>
          </div>
        </div>
        <button
          onClick={onApplyClick}
          className="shrink-0 bg-indigo-600 text-white rounded-xl px-5 py-2.5 hover:bg-indigo-700 transition font-medium text-sm shadow-sm w-full sm:w-auto">
          Apply for Authorization
        </button>
      </div>
    );
  }

  if (sellerStatus === "pending_review") {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 shrink-0 bg-yellow-100 dark:bg-yellow-800/40 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-500">
            <svg
              className="w-6 h-6 animate-[spin_3s_linear_infinite]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">
              Application Under Review
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-500/80 mt-1">
              Your seller application is being reviewed by our admin team. This
              usually takes 24–48 hours.
            </p>
            {sellerAppliedAt && (
              <p className="text-xs text-yellow-600 dark:text-yellow-600 mt-1">
                Applied: {timeAgo(sellerAppliedAt)}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
          <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-300 text-xs font-semibold px-3 py-1 rounded-full">
            Pending Review
          </span>
          <button
            onClick={onViewClick}
            className="text-xs text-yellow-700 dark:text-yellow-500 hover:underline">
            View Application
          </button>
        </div>
      </div>
    );
  }

  if (sellerStatus === "authorized") {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 shrink-0 bg-green-100 dark:bg-green-800/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-500">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-400">
              ✓ Authorized Seller
            </h3>
            <p className="text-sm text-green-600 dark:text-green-500/80 mt-1">
              Your account is verified. You can create and manage auctions.
            </p>
          </div>
        </div>
        <span className="shrink-0 bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded-full">
          Authorized
        </span>
      </div>
    );
  }

  if (sellerStatus === "rejected") {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4 w-full">
          <div className="w-10 h-10 shrink-0 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-500">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 dark:text-red-400">
              Application Rejected
            </h3>
            {sellerStatusReason && (
              <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 mt-2 inline-block">
                <span className="text-xs font-semibold text-red-700 dark:text-red-400 block mb-0.5">
                  Reason:
                </span>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {sellerStatusReason}
                </p>
              </div>
            )}
            <p className="text-xs text-red-500 mt-2">
              You may update your profile and reapply.
            </p>
          </div>
        </div>
        <button
          onClick={onReapplyClick}
          className="shrink-0 bg-red-600 text-white rounded-xl px-5 py-2.5 hover:bg-red-700 transition font-medium text-sm shadow-sm w-full sm:w-auto mt-4 sm:mt-0">
          Reapply
        </button>
      </div>
    );
  }

  if (sellerStatus === "suspended") {
    return (
      <div className="bg-gray-900 dark:bg-gray-950 border border-gray-700 dark:border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4 w-full">
          <div className="w-10 h-10 shrink-0 bg-gray-800 rounded-full flex items-center justify-center text-red-500">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Account Suspended</h3>
            {sellerStatusReason && (
              <div className="bg-gray-800 rounded-lg p-3 mt-2 inline-block">
                <p className="text-sm text-gray-300">{sellerStatusReason}</p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              <a
                href="mailto:support@realtimeauction.com"
                className="hover:text-white underline">
                Contact support
              </a>{" "}
              to appeal this decision.
            </p>
          </div>
        </div>
        <span className="shrink-0 bg-red-500/20 text-red-400 text-xs font-semibold px-3 py-1 rounded-full border border-red-500/30">
          Suspended
        </span>
      </div>
    );
  }

  return null;
};

export default SellerStatusBanner;
