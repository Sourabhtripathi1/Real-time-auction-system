import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getSellerById,
  updateSellerStatus,
} from "../../services/sellerAuthApi";
import SellerStatusActionModal from "./SellerStatusActionModal";

const timeAgo = (d) => {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const formatDate = (d) => {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SellerDetailModal = ({ isOpen, onClose, sellerId, onAction }) => {
  const [sellerData, setSellerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeActionModal, setActiveActionModal] = useState(null); // 'reject', 'suspend', 'revoke'

  useEffect(() => {
    if (isOpen && sellerId) {
      setLoading(true);
      getSellerById(sellerId)
        .then((res) => setSellerData(res.data))
        .catch((err) => {
          toast.error("Failed to fetch seller details");
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, sellerId, onClose]);

  // Press ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !activeActionModal) onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, activeActionModal]);

  if (!isOpen) return null;

  const handleDirectAction = async (action) => {
    setActionLoading(true);
    try {
      await updateSellerStatus(sellerId, { action });
      const verb =
        action === "authorize"
          ? "authorized"
          : action === "revoke"
            ? "reinstated"
            : action;
      toast.success(`Seller ${verb} successfully`);
      onAction(); // refresh table

      // refetch details
      const res = await getSellerById(sellerId);
      setSellerData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalActionSuccess = async (updatedSeller) => {
    onAction(); // refresh table
    // refetch details
    const res = await getSellerById(sellerId);
    setSellerData(res.data);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}>
        <div
          className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12 min-h-[400px]">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : sellerData ? (
            <>
              <div className="overflow-y-auto w-full">
                {/* Header */}
                <div className="p-6 pb-0 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {sellerData.seller.profileImage?.url ? (
                      <img
                        src={sellerData.seller.profileImage.url}
                        alt={sellerData.seller.name}
                        className="w-16 h-16 rounded-full object-cover shadow-sm bg-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-xl font-bold shadow-sm">
                        {sellerData.seller.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {sellerData.seller.name}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                        {sellerData.seller.email}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs px-2 py-0.5 rounded-md font-medium">
                          Role: {sellerData.seller.role}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                            sellerData.seller.sellerStatus === "authorized"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                              : sellerData.seller.sellerStatus ===
                                  "pending_review"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                                : sellerData.seller.sellerStatus === "rejected"
                                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                  : sellerData.seller.sellerStatus ===
                                      "suspended"
                                    ? "bg-gray-800 text-red-400 border-gray-700"
                                    : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                          }`}>
                          Status: {sellerData.seller.sellerStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Member since {formatDate(sellerData.seller.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 -mt-2 -mr-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 rounded-full transition">
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

                <div className="p-6 space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-800 border-b-2 border-b-indigo-400">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sellerData.auctionStats.total}
                      </p>
                      <p className="text-xs font-medium text-gray-500 uppercase mt-1 tracking-wide">
                        Total Auctions
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-800 border-b-2 border-b-emerald-400">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sellerData.auctionStats.active}
                      </p>
                      <p className="text-xs font-medium text-gray-500 uppercase mt-1 tracking-wide">
                        Active Auctions
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-800 border-b-2 border-b-gray-400">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sellerData.auctionStats.ended}
                      </p>
                      <p className="text-xs font-medium text-gray-500 uppercase mt-1 tracking-wide">
                        Ended Auctions
                      </p>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Business Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div>
                        <span className="block text-gray-500 dark:text-gray-400 mb-1">
                          Business Name
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {sellerData.seller.sellerProfile?.businessName || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-500 dark:text-gray-400 mb-1">
                          Business Type
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {sellerData.seller.sellerProfile?.businessType?.replace(
                            "_",
                            " ",
                          ) || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-500 dark:text-gray-400 mb-1">
                          Website
                        </span>
                        {sellerData.seller.sellerProfile?.website ? (
                          <a
                            href={sellerData.seller.sellerProfile.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline max-w-[200px] truncate block"
                            title={sellerData.seller.sellerProfile.website}>
                            {sellerData.seller.sellerProfile.website}
                          </a>
                        ) : (
                          <span className="text-gray-900 dark:text-gray-400">
                            —
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="block text-gray-500 dark:text-gray-400 mb-1">
                          Applied
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {sellerData.seller.sellerAppliedAt
                            ? timeAgo(sellerData.seller.sellerAppliedAt)
                            : "Never applied"}
                        </span>
                      </div>

                      <div className="sm:col-span-2 pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
                        <span className="block text-gray-500 dark:text-gray-400 mb-2">
                          Social Links
                        </span>
                        <div className="flex flex-col gap-2">
                          {sellerData.seller.sellerProfile?.socialLinks
                            ?.instagram && (
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="text-pink-600 font-medium w-6 inline-block">
                                IG
                              </span>{" "}
                              {
                                sellerData.seller.sellerProfile.socialLinks
                                  .instagram
                              }
                            </div>
                          )}
                          {sellerData.seller.sellerProfile?.socialLinks
                            ?.facebook && (
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="text-blue-600 font-medium w-6 inline-block">
                                FB
                              </span>{" "}
                              {
                                sellerData.seller.sellerProfile.socialLinks
                                  .facebook
                              }
                            </div>
                          )}
                          {sellerData.seller.sellerProfile?.socialLinks
                            ?.twitter && (
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="text-sky-500 font-medium w-6 inline-block">
                                TW
                              </span>{" "}
                              {
                                sellerData.seller.sellerProfile.socialLinks
                                  .twitter
                              }
                            </div>
                          )}
                          {!sellerData.seller.sellerProfile?.socialLinks
                            ?.instagram &&
                            !sellerData.seller.sellerProfile?.socialLinks
                              ?.facebook &&
                            !sellerData.seller.sellerProfile?.socialLinks
                              ?.twitter && (
                              <span className="text-gray-400">—</span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      About Their Business
                    </h3>
                    {sellerData.seller.sellerProfile?.description ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {sellerData.seller.sellerProfile.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No description provided
                      </p>
                    )}
                  </div>

                  {/* Current Status Reason Box */}
                  {sellerData.seller.sellerStatusReason && (
                    <div
                      className={`p-4 rounded-xl border ${sellerData.seller.sellerStatus === "rejected" ? "bg-red-50 border-red-200 dark:bg-red-900/20" : sellerData.seller.sellerStatus === "suspended" ? "bg-gray-900 border-gray-700 text-white" : "bg-orange-50 border-orange-200"}`}>
                      <h4 className="font-semibold text-sm mb-1 opacity-90">
                        Current Status Reason:
                      </h4>
                      <p className="text-sm">
                        {sellerData.seller.sellerStatusReason}
                      </p>
                      <p className="text-xs mt-2 opacity-70">
                        {sellerData.seller.sellerStatusUpdatedBy?.name ||
                          "Admin"}{" "}
                        · {timeAgo(sellerData.seller.sellerStatusUpdatedAt)}
                      </p>
                    </div>
                  )}

                  {/* Last 5 Auctions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Recent Auctions (last 5)
                    </h3>
                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">
                              Title
                            </th>
                            <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400 w-24">
                              Status
                            </th>
                            <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400 w-32">
                              Created
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {sellerData.recentAuctions.length === 0 ? (
                            <tr>
                              <td
                                colSpan="3"
                                className="px-4 py-6 text-center text-gray-400 bg-white dark:bg-gray-900">
                                No auctions created yet
                              </td>
                            </tr>
                          ) : (
                            sellerData.recentAuctions.map((a) => (
                              <tr
                                key={a._id}
                                className="bg-white dark:bg-gray-900">
                                <td
                                  className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]"
                                  title={a.title}>
                                  {a.title}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] px-1.5 py-0.5 rounded font-medium tracking-wide uppercase">
                                    {a.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                                  {formatDate(a.createdAt)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="text-gray-400 block text-xs">Phone</span>
                      <span className="text-gray-800 dark:text-gray-200">
                        {sellerData.seller.contactNumber || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">
                        Address
                      </span>
                      <span className="text-gray-800 dark:text-gray-200">
                        {sellerData.seller.address?.city
                          ? `${sellerData.seller.address.city}, ${sellerData.seller.address.state || ""}`
                          : "—"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 block text-xs">
                        Last Login
                      </span>
                      <span className="text-gray-800 dark:text-gray-200">
                        {timeAgo(sellerData.seller.lastLogin)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex justify-end gap-3 shrink-0 rounded-b-3xl">
                {actionLoading ? (
                  <div className="px-6 py-2 flex items-center h-[38px]">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {sellerData.seller.sellerStatus === "pending_review" && (
                      <>
                        <button
                          onClick={() => setActiveActionModal("reject")}
                          className="px-5 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-xl transition">
                          Reject
                        </button>
                        <button
                          onClick={() => handleDirectAction("authorize")}
                          className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition shadow-sm">
                          Authorize
                        </button>
                      </>
                    )}

                    {sellerData.seller.sellerStatus === "authorized" && (
                      <>
                        <button
                          onClick={() => setActiveActionModal("revoke")}
                          className="px-5 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 rounded-xl transition">
                          Revoke Auth
                        </button>
                        <button
                          onClick={() => setActiveActionModal("suspend")}
                          className="px-5 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 dark:text-red-400 dark:bg-transparent dark:border-red-800 dark:hover:bg-red-900/20 rounded-xl transition">
                          Suspend Account
                        </button>
                      </>
                    )}

                    {sellerData.seller.sellerStatus === "rejected" && (
                      <button
                        onClick={() => handleDirectAction("authorize")}
                        className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition shadow-sm">
                        Authorize
                      </button>
                    )}

                    {sellerData.seller.sellerStatus === "suspended" && (
                      <button
                        onClick={() => handleDirectAction("revoke")}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm">
                        Reinstate Account
                      </button>
                    )}

                    {sellerData.seller.sellerStatus === "unverified" && (
                      <button
                        disabled
                        className="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl cursor-not-allowed">
                        Application Pending
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-red-500">
              Failed to load seller details
            </div>
          )}
        </div>
      </div>

      {activeActionModal && (
        <SellerStatusActionModal
          isOpen={true}
          onClose={() => setActiveActionModal(null)}
          action={activeActionModal}
          sellerName={sellerData?.seller?.name}
          sellerId={sellerId}
          onSuccess={handleModalActionSuccess}
        />
      )}
    </>
  );
};

export default SellerDetailModal;
