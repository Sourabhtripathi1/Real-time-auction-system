import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  createAuction,
  getMyAuctions,
  getPendingAuctions,
  approveAuction,
  submitForVerification,
  updateAuction,
  deleteAuction,
} from "../services/auctionApi";
import EditAuctionModal from "../components/EditAuctionModal";
import CreateAuctionModal from "../components/CreateAuctionModal";
import RejectAuctionModal from "../components/RejectAuctionModal";

// ── Status styling + labels ────────────────────────────────
const STATUS_CONFIG = {
  inactive: {
    label: "Inactive",
    style: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  pending: {
    label: "Pending Review",
    style:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  rejected: {
    label: "Rejected",
    style: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  },
  approved: {
    label: "Approved",
    style: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
  active: {
    label: "Live",
    style:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  ended: {
    label: "Ended",
    style: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  },
};

const formatDate = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const inputClass =
  "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition";
const labelClass =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

const SkeletonRows = ({ cols = 6, rows = 3 }) =>
  Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="animate-pulse">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        </td>
      ))}
    </tr>
  ));


// ── Delete Confirmation Inline ─────────────────────────────
const DeleteConfirm = ({ onConfirm, onCancel, loading }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
      Are you sure?
    </span>
    <button
      onClick={onConfirm}
      disabled={loading}
      className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-md transition disabled:opacity-50">
      {loading ? "…" : "Confirm"}
    </button>
    <button
      onClick={onCancel}
      className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition">
      Cancel
    </button>
  </div>
);

// ── Auction row action buttons ─────────────────────────────
const AuctionActions = ({ auction, onEdit, onSubmit, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const status = auction.status;

  const canEdit = ["inactive", "pending", "rejected"].includes(status);
  const canDelete = ["inactive", "pending", "rejected"].includes(status);
  const canSubmit = ["inactive"].includes(status);
  const isLocked = ["approved", "active", "ended"].includes(status);

  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      await onSubmit(auction._id);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await onDelete(auction._id);
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(false);
    }
  };

  if (isLocked) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600"
        title="Cannot modify active/ended auction">
        <span>🔒</span>
        <span>Locked</span>
      </div>
    );
  }

  if (confirmDelete) {
    return (
      <DeleteConfirm
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteLoading}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === "rejected" && auction.rejectionReason && (
        <button
          onClick={() => alert(`Rejection Reason: ${auction.rejectionReason}`)}
          className="px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-md transition">
          View Reason
        </button>
      )}

      {canEdit && (
        <button
          onClick={() => onEdit(auction)}
          className="px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-md transition">
          Edit
        </button>
      )}

      {canSubmit && (
        <button
          onClick={handleSubmit}
          disabled={submitLoading}
          className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-md transition disabled:opacity-50">
          {submitLoading ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting
            </span>
          ) : (
            "Submit for Review"
          )}
        </button>
      )}

      {canDelete && (
        <button
          onClick={() => setConfirmDelete(true)}
          className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition">
          Delete
        </button>
      )}
    </div>
  );
};

// ── Status note ────────────────────────────────────────────
const StatusNote = ({ status }) => {
  if (status === "pending") {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
        ⏳ Awaiting admin review
      </p>
    );
  }
  // if (status === "rejected") {
  //   return (
  //     <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
  //       ✕ Rejected — edit and resubmit
  //     </p>
  //   );
  // }
  return null;
};

// ═══════════════════════════════════════════════════════════
// SELLER DASHBOARD
// ═══════════════════════════════════════════════════════════
const SellerDashboard = () => {
  const [myAuctions, setMyAuctions] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [editingAuction, setEditingAuction] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fadingOutId, setFadingOutId] = useState(null);

  const fetchAuctions = useCallback(async () => {
    try {
      const r = await getMyAuctions();
      setMyAuctions(r.data || []);
    } catch {
      /* silent */
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleCreateSave = async (formData) => {
    const res = await createAuction(formData);
    setMyAuctions((prev) => [res.data, ...prev]);
    toast.success(res.message || "Auction created as draft!");
  };

  const handleSubmitForReview = async (auctionId) => {
    try {
      await submitForVerification(auctionId);
      setMyAuctions((prev) =>
        prev.map((a) =>
          a._id === auctionId ? { ...a, status: "pending" } : a,
        ),
      );
      toast.success("✅ Submitted for admin review");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    }
  };

  const handleEdit = (auction) => setEditingAuction(auction);

  const handleEditSave = async (auctionId, formData, previousStatus) => {
    const res = await updateAuction(auctionId, formData);
    setMyAuctions((prev) =>
      prev.map((a) => (a._id === auctionId ? res.data : a)),
    );
    if (["pending", "rejected"].includes(previousStatus)) {
      toast.warning(
        "⚠️ Auction moved to Inactive. Please resubmit for verification.",
      );
    } else {
      toast.success("✅ Auction updated");
    }
  };

  const handleDelete = async (auctionId) => {
    try {
      await deleteAuction(auctionId);
      setFadingOutId(auctionId);
      setTimeout(() => {
        setMyAuctions((prev) => prev.filter((a) => a._id !== auctionId));
        setFadingOutId(null);
      }, 300);
      toast.success("🗑 Auction deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <>
      {editingAuction && (
        <EditAuctionModal
          auction={editingAuction}
          onClose={() => setEditingAuction(null)}
          onSave={handleEditSave}
        />
      )}

      {isCreateModalOpen && (
        <CreateAuctionModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateSave}
        />
      )}

      {/* My Auctions Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Auctions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Manage your listings
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition shadow-sm">
            + Create New Auction
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                {[
                  "Title",
                  "Base Price",
                  "Status",
                  "Start",
                  "End",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tableLoading ? (
                <SkeletonRows cols={6} />
              ) : myAuctions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400 dark:text-gray-600">
                    You haven&apos;t created any auctions yet.
                  </td>
                </tr>
              ) : (
                myAuctions.map((a) => {
                  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.inactive;

                  return (
                    <tr
                      key={a._id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all duration-300 ${fadingOutId === a._id ? "opacity-0 scale-95" : "opacity-100"}`}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                        {a.title}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        ₹{a.basePrice?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.style}`}>
                            {cfg.label}
                          </span>
                          <StatusNote status={a.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(a.startTime)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(a.endTime)}
                      </td>
                      <td className="px-4 py-3">
                        <AuctionActions
                          auction={a}
                          onEdit={handleEdit}
                          onSubmit={handleSubmitForReview}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModalAuction, setRejectModalAuction] = useState(null);

  useEffect(() => {
    getPendingAuctions()
      .then((r) => setPending(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approveAuction(id, { action: "approve" });
      setPending((prev) => prev.filter((a) => a._id !== id));
      toast.success("✅ Auction approved successfully");
    } catch {
      toast.error("❌ Failed to approve auction");
    } finally {
      setActionLoading(null);
    }
  };

  const submitReject = async (id, reason) => {
    await approveAuction(id, { action: "reject", rejectionReason: reason });
    setPending((prev) => prev.filter((a) => a._id !== id));
    setRejectModalAuction(null);
    toast.success("❌ Auction rejected with reason provided");
  };

  return (
    <>
      {rejectModalAuction && (
        <RejectAuctionModal
          auctionId={rejectModalAuction._id}
          auctionTitle={rejectModalAuction.title}
          onClose={() => setRejectModalAuction(null)}
          onSubmit={submitReject}
        />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Approvals
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Review and approve seller auction requests
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                {["Title", "Seller", "Base Price", "Created At", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <SkeletonRows cols={5} />
              ) : pending.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-gray-400 dark:text-gray-600">
                    No pending auctions to review.
                  </td>
                </tr>
              ) : (
                pending.map((a) => (
                  <tr
                    key={a._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {a.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {a.seller?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      ₹{a.basePrice?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(a._id)}
                          disabled={actionLoading === a._id}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg transition disabled:opacity-50">
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModalAuction(a)}
                          disabled={actionLoading === a._id}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// BIDDER DASHBOARD
// ═══════════════════════════════════════════════════════════
const BidderDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
      <svg
        className="w-16 h-16 mx-auto text-primary-400 dark:text-primary-500 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Ready to bid?
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Browse active auctions and place your bids in real time.
      </p>
      <button
        onClick={() => navigate("/auctions")}
        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition">
        Browse Auctions
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.message) {
      toast.error(location.state.message);
      // Clear state so reload doesn't trigger toast again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const roleLabels = {
    seller: "Seller Dashboard",
    admin: "Admin Dashboard",
    bidder: "Bidder Dashboard",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {roleLabels[user?.role] || "Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome back, {user?.name}
        </p>
      </div>
      {user?.role === "seller" && <SellerDashboard />}
      {user?.role === "admin" && <AdminDashboard />}
      {user?.role === "bidder" && <BidderDashboard />}
    </div>
  );
};

export default Dashboard;
