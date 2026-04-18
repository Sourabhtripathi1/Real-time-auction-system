import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { toast } from "react-toastify";
import {
  createAuction,
  approveAuction,
  submitForVerification,
  updateAuction,
  deleteAuction,
} from "../services/auctionApi";
import {
  getMyAuctions,
  getPendingAuctions,
  getAllAuctions,
  getMyBids,
} from "../services/dashboardApi";
import { getMySellerStatus, getAllSellers } from "../services/sellerAuthApi";
import EditAuctionModal from "../components/EditAuctionModal";
import CreateAuctionModal from "../components/CreateAuctionModal";
import RejectAuctionModal from "../components/RejectAuctionModal";
import AdminAuctionDetailsModal from "../components/AdminAuctionDetailsModal";
import LightboxModal from "../components/LightboxModal";
import FilterBar from "../components/dashboard/FilterBar";
import StatusTabs from "../components/dashboard/StatusTabs";
import Pagination from "../components/dashboard/Pagination";
import SummaryCards from "../components/dashboard/SummaryCards";
import SellerStatusBanner from "../components/seller/SellerStatusBanner";
import SellerApplicationModal from "../components/seller/SellerApplicationModal";
import SellerDetailModal from "../components/admin/SellerDetailModal";
import SellerStatusActionModal from "../components/admin/SellerStatusActionModal";
import useDashboardFilters from "../hooks/useDashboardFilters";

// ── Status config ──────────────────────────────────────────
const STATUS_CONFIG = {
  inactive: {
    label: "Draft",
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
    style: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  },
};

// ── Shared helpers ─────────────────────────────────────────
const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const timeAgo = (d) => {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const Spinner = ({ size = "sm" }) => (
  <span
    className={`inline-block border-2 border-white/30 border-t-white rounded-full animate-spin ${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}`}
  />
);

// ── Skeleton row ───────────────────────────────────────────
const SkeletonRows = ({ cols = 7, rows = 5 }) =>
  Array.from({ length: rows }).map((_, i) => (
    <tr
      key={i}
      className="animate-pulse border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="px-4 py-4">
          <div
            className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${j === 0 ? "w-8" : j === 1 ? "w-32" : "w-20"}`}
          />
        </td>
      ))}
    </tr>
  ));

// ── Status badge ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.style}`}>
      {status === "active" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
      )}
      {cfg.label}
    </span>
  );
};

// ── Auction thumbnail ──────────────────────────────────────
const AuctionThumb = ({ auction, onLightbox }) =>
  auction?.images?.length > 0 ? (
    <button
      onClick={() => onLightbox?.(auction.images)}
      className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group shrink-0">
      <img
        src={auction.images[0].url}
        alt={auction.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
      {auction.images.length > 1 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">
            +{auction.images.length - 1}
          </span>
        </div>
      )}
    </button>
  ) : (
    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );

// ── Seller avatar ──────────────────────────────────────────
const SellerAvatar = ({ seller }) => {
  const [err, setErr] = useState(false);
  return seller?.profileImage?.url && !err ? (
    <img
      src={seller.profileImage.url}
      alt={seller.name}
      onError={() => setErr(true)}
      className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700 shrink-0"
    />
  ) : (
    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-xs font-bold shrink-0">
      {(seller?.name || "?")[0].toUpperCase()}
    </div>
  );
};

// ── Sort header cell ───────────────────────────────────────
const SortTh = ({ label, field, filters, className = "" }) => {
  const isActive = filters.filters.sortBy === field;
  const isAsc = filters.filters.sortOrder === "asc";
  const toggle = () =>
    filters.setSort(
      field,
      isActive && !isAsc ? "asc" : isActive ? "desc" : "desc",
    );
  return (
    <th
      onClick={toggle}
      className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide cursor-pointer select-none whitespace-nowrap group ${
        isActive
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-gray-500 dark:text-gray-400"
      } ${className}`}>
      <span className="flex items-center gap-1">
        {label}
        <span
          className={`transition-opacity ${isActive ? "opacity-100 text-indigo-500" : "opacity-0 group-hover:opacity-50"}`}>
          {isActive ? (isAsc ? " ↑" : " ↓") : " ↕"}
        </span>
      </span>
    </th>
  );
};

const Th = ({ children, className = "" }) => (
  <th
    className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap ${className}`}>
    {children}
  </th>
);

// ── Empty state ────────────────────────────────────────────
const EmptyState = ({
  hasFilters,
  onClearFilters,
  onCreate,
  emptyTitle,
  emptySubtitle,
  emptyAction,
}) => (
  <tr>
    <td colSpan={99}>
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        {hasFilters ? (
          <>
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
              No results match your filters
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition">
              Clear Filters
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">{emptyTitle ? "🏷️" : "📋"}</div>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {emptyTitle || "Nothing here yet"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {emptySubtitle || ""}
            </p>
            {onCreate && (
              <button
                onClick={onCreate}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
                {emptyAction || "Create"}
              </button>
            )}
          </>
        )}
      </div>
    </td>
  </tr>
);

// ── Delete confirmation ────────────────────────────────────
const DeleteConfirm = ({ onConfirm, onCancel, loading }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
      Sure?
    </span>
    <button
      onClick={onConfirm}
      disabled={loading}
      className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md transition disabled:opacity-50 flex items-center gap-1">
      {loading && <Spinner />}
      {loading ? "" : "Yes"}
    </button>
    <button
      onClick={onCancel}
      className="px-2 py-1 text-xs text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 transition">
      No
    </button>
  </div>
);

// ── Auction action buttons (seller) ────────────────────────
const AuctionActions = ({ auction, onEdit, onSubmit, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { status } = auction;

  const canEdit = ["inactive", "pending", "rejected"].includes(status);
  const canDelete = ["inactive", "pending", "rejected"].includes(status);
  const canSubmit = status === "inactive" || status === "rejected";
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

  if (isLocked)
    return (
      <span
        title={`Cannot modify — auction is ${status}`}
        className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600 cursor-not-allowed">
        🔒 Locked
      </span>
    );

  if (confirmDelete)
    return (
      <DeleteConfirm
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteLoading}
      />
    );

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {status === "pending" && (
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
          ⏳ Under Review
        </span>
      )}
      {status === "rejected" && auction.rejectionReason && (
        <button
          onClick={() =>
            toast.error(`❌ Rejection: ${auction.rejectionReason}`, {
              autoClose: 8000,
            })
          }
          className="px-2 py-1 text-xs text-amber-600 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-md transition">
          ⚠ Reason
        </button>
      )}
      {canEdit && (
        <button
          onClick={() => onEdit(auction)}
          className="px-2.5 py-1 text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-md transition"
          title={status === "pending" ? "Editing resets to draft" : "Edit"}>
          Edit
        </button>
      )}
      {canSubmit && (
        <button
          onClick={handleSubmit}
          disabled={submitLoading}
          className="px-2.5 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition disabled:opacity-50 flex items-center gap-1">
          {submitLoading && <Spinner />}
          Submit
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => setConfirmDelete(true)}
          className="px-2.5 py-1 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition">
          Delete
        </button>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// SELLER DASHBOARD
// ══════════════════════════════════════════════════════════════════
const SellerDashboard = () => {
  const { socket } = useSocket();
  const filters = useDashboardFilters();

  const [auctions, setAuctions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [fadingId, setFadingId] = useState(null);
  const [flashId, setFlashId] = useState(null);

  const [editingAuction, setEditingAuction] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState(null);

  // Seller Auth State
  const { sellerStatus, updateSellerStatus } = useAuth();
  const [sellerAuth, setSellerAuth] = useState(null);
  const [appModalMode, setAppModalMode] = useState(null); // 'apply', 'reapply', 'view'

  const fetchSellerStatus = useCallback(
    async (silent = false) => {
      try {
        const res = await getMySellerStatus();
        setSellerAuth(res.data);
        if (res.data.sellerStatus !== sellerStatus) {
          updateSellerStatus(res.data.sellerStatus);
          if (silent && res.data.sellerStatus === "authorized") {
            toast.success(
              "🎉 Your seller account is now authorized! You can create auctions.",
              { autoClose: 6000 },
            );
          } else if (silent && res.data.sellerStatus === "rejected") {
            toast.error(
              "❌ Your seller application was rejected. Check the reason and reapply.",
            );
          }
        }
      } catch {
        /* silent */
      }
    },
    [sellerStatus, updateSellerStatus],
  );

  useEffect(() => {
    fetchSellerStatus();
  }, [fetchSellerStatus]);

  // Polling if pending
  useEffect(() => {
    let id;
    if (sellerAuth?.sellerStatus === "pending_review") {
      id = setInterval(() => {
        fetchSellerStatus(true);
      }, 30_000);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [sellerAuth?.sellerStatus, fetchSellerStatus]);

  // ── Fetch ──────────────────────────────────────────────
  const fetchData = useCallback(async (qs) => {
    setIsLoading(true);
    try {
      const res = await getMyAuctions(qs);
      const d = res.data;
      setAuctions(d.auctions || []);
      setPagination(d.pagination || {});
      setSummary(d.summary || {});
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters.buildQueryString());
  }, [filters.filters]); // eslint-disable-line

  // ── Socket: real-time row updates ─────────────────────
  useEffect(() => {
    if (!socket) return;
    const onBidUpdated = ({ auctionId, highestBid }) => {
      setAuctions((prev) =>
        prev.map((a) =>
          a._id === auctionId ? { ...a, currentHighestBid: highestBid } : a,
        ),
      );
      setFlashId(auctionId);
      setTimeout(() => setFlashId(null), 1500);
    };
    const onAuctionEnded = ({ auctionId }) => {
      setAuctions((prev) =>
        prev.map((a) => (a._id === auctionId ? { ...a, status: "ended" } : a)),
      );
      setSummary((prev) => ({
        ...prev,
        active: Math.max(0, (prev.active || 1) - 1),
        ended: (prev.ended || 0) + 1,
      }));
    };
    socket.on("bidUpdated", onBidUpdated);
    socket.on("auctionEnded", onAuctionEnded);
    return () => {
      socket.off("bidUpdated", onBidUpdated);
      socket.off("auctionEnded", onAuctionEnded);
    };
  }, [socket]);

  // ── Handlers ──────────────────────────────────────────
  const handleCreateSave = async (formData) => {
    const res = await createAuction(formData);
    toast.success(res.message || "Auction created as draft!");
    fetchData(filters.buildQueryString());
  };

  const handleEditSave = async (auctionId, formData, previousStatus) => {
    const res = await updateAuction(auctionId, formData);
    setAuctions((prev) =>
      prev.map((a) => (a._id === auctionId ? res.data : a)),
    );
    if (["pending", "rejected"].includes(previousStatus)) {
      toast.warning(
        "⚠️ Auction moved to Draft. Please resubmit for verification.",
      );
    } else {
      toast.success("✅ Auction updated");
    }
  };

  const handleSubmitForReview = async (auctionId) => {
    try {
      await submitForVerification(auctionId);
      setAuctions((prev) =>
        prev.map((a) =>
          a._id === auctionId ? { ...a, status: "pending" } : a,
        ),
      );
      setSummary((prev) => ({
        ...prev,
        inactive: Math.max(0, (prev.inactive || 1) - 1),
        pending: (prev.pending || 0) + 1,
      }));
      toast.success("✅ Submitted for admin review");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    }
  };

  const handleDelete = async (auctionId) => {
    try {
      await deleteAuction(auctionId);
      setFadingId(auctionId);
      setTimeout(() => {
        setAuctions((prev) => prev.filter((a) => a._id !== auctionId));
        setFadingId(null);
        setSummary((prev) => ({
          ...prev,
          total: Math.max(0, (prev.total || 1) - 1),
        }));
      }, 300);
      toast.success("🗑 Auction deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  // Seller tabs
  const sellerTabs = [
    { value: "all", label: "All", count: summary.total },
    { value: "inactive", label: "Draft", count: summary.inactive },
    { value: "pending", label: "Pending", count: summary.pending },
    { value: "active", label: "Live", count: summary.active },
    { value: "rejected", label: "Rejected", count: summary.rejected },
    { value: "ended", label: "Ended", count: summary.ended },
  ];

  return (
    <>
      <SellerApplicationModal
        isOpen={!!appModalMode}
        onClose={() => setAppModalMode(null)}
        mode={appModalMode}
        existingData={sellerAuth}
        onSuccess={fetchSellerStatus}
      />

      {editingAuction && (
        <EditAuctionModal
          auction={editingAuction}
          onClose={() => setEditingAuction(null)}
          onSave={handleEditSave}
        />
      )}
      {isCreateOpen && (
        <CreateAuctionModal
          onClose={() => setIsCreateOpen(false)}
          onSave={handleCreateSave}
        />
      )}
      {lightboxImages && (
        <LightboxModal
          images={lightboxImages}
          onClose={() => setLightboxImages(null)}
        />
      )}

      <div className="space-y-6">
        {sellerAuth?.sellerStatus && (
          <SellerStatusBanner
            sellerStatus={sellerAuth.sellerStatus}
            sellerStatusReason={sellerAuth.sellerStatusReason}
            sellerAppliedAt={sellerAuth.sellerAppliedAt}
            onApplyClick={() => setAppModalMode("apply")}
            onReapplyClick={() => setAppModalMode("reapply")}
            onViewClick={() => setAppModalMode("view")}
          />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Auctions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Manage and track all your auction listings
            </p>
          </div>

          {sellerAuth?.sellerStatus === "authorized" ? (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition shadow-sm flex items-center gap-2">
              <span className="text-lg leading-none">+</span> Create Auction
            </button>
          ) : (
            <button
              onClick={() =>
                setAppModalMode(
                  sellerAuth?.sellerStatus === "rejected" ? "reapply" : "apply",
                )
              }
              title="Get seller authorization to create auctions"
              className="px-5 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl transition shadow-sm flex items-center gap-2">
              <span>🔒</span> Create Auction
            </button>
          )}
        </div>

        {/* Summary cards */}
        <SummaryCards
          summary={summary}
          role="seller"
          isLoading={isLoading && !auctions.length}
          activeStatus={filters.filters.status}
          onStatusClick={filters.setStatus}
        />

        {/* Status tabs */}
        <StatusTabs
          tabs={sellerTabs}
          activeTab={filters.filters.status}
          onChange={filters.setStatus}
        />

        {/* Filter bar */}
        <FilterBar
          filters={filters.filters}
          onFilterChange={filters}
          onReset={filters.resetFilters}
          activeCount={filters.activeFilterCount}
          role="seller"
          isLoading={isLoading}
        />

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <Th className="w-8">#</Th>
                  <Th>Auction</Th>
                  <SortTh label="Price" field="basePrice" filters={filters} />
                  <Th>Status</Th>
                  <SortTh label="Timeline" field="endTime" filters={filters} />
                  <Th>Bids</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <SkeletonRows cols={7} />
                ) : auctions.length === 0 ? (
                  <EmptyState
                    hasFilters={filters.activeFilterCount > 0}
                    onClearFilters={filters.resetFilters}
                    onCreate={() => setIsCreateOpen(true)}
                    emptyTitle="No auctions yet"
                    emptySubtitle="Create your first auction to get started"
                    emptyAction="Create Auction"
                  />
                ) : (
                  auctions.map((a, idx) => {
                    const page = filters.filters.page;
                    const limit = filters.filters.limit;
                    const rowNum = (page - 1) * limit + idx + 1;
                    const isEndingSoon =
                      a.status === "active" &&
                      new Date(a.endTime) - Date.now() < 3_600_000;
                    const isFading = fadingId === a._id;
                    const isFlashing = flashId === a._id;

                    return (
                      <tr
                        key={a._id}
                        className={`transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                          isFading ? "opacity-0 scale-98" : "opacity-100"
                        } ${isFlashing ? "bg-indigo-50 dark:bg-indigo-950/30" : ""}`}>
                        <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-600 font-mono">
                          {rowNum}
                        </td>

                        {/* Auction */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <AuctionThumb
                              auction={a}
                              onLightbox={setLightboxImages}
                            />
                            <div className="min-w-0">
                              <p
                                className="font-medium text-gray-900 dark:text-white text-sm leading-tight truncate max-w-[180px]"
                                title={a.title}>
                                {a.title}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-600 font-mono mt-0.5">
                                #{a._id.slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Base: ₹{a.basePrice?.toLocaleString("en-IN")}
                          </p>
                          {a.currentHighestBid > 0 ? (
                            <p
                              className={`font-semibold text-sm mt-0.5 transition-colors ${isFlashing ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                              ₹{a.currentHighestBid?.toLocaleString("en-IN")}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              No bids
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={a.status} />
                        </td>

                        {/* Timeline */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {fmtDate(a.startTime)}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${isEndingSoon ? "text-red-500 dark:text-red-400 font-semibold" : "text-gray-500 dark:text-gray-400"}`}>
                            → {fmtDate(a.endTime)}
                            {isEndingSoon && " ⚡"}
                          </p>
                        </td>

                        {/* Bids */}
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              a.bidCount > 0
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            }`}>
                            {a.bidCount ?? 0} bids
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <AuctionActions
                            auction={a}
                            onEdit={setEditingAuction}
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

        {/* Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={filters.setPage}
          onLimitChange={filters.setLimit}
          isLoading={isLoading}
        />
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { socket } = useSocket();
  const [adminTab, setAdminTab] = useState("pending"); // "pending" | "all" | "sellers"

  // Separate filter instances per tab — state preserved on tab switch
  const pendingFilters = useDashboardFilters();
  const allFilters = useDashboardFilters();
  const sellerFilters = useDashboardFilters();

  // ── Pending tab state ──────────────────────────────────
  const [pending, setPending] = useState([]);
  const [pendingPag, setPendingPag] = useState({});
  const [pendingLoad, setPendingLoad] = useState(true);

  // ── All auctions tab state ─────────────────────────────
  const [allAuctions, setAllAuctions] = useState([]);
  const [allPag, setAllPag] = useState({});
  const [allSummary, setAllSummary] = useState({});
  const [allLoad, setAllLoad] = useState(true);

  // ── Sellers tab state ──────────────────────────────────
  const [sellersList, setSellersList] = useState([]);
  const [sellerPag, setSellerPag] = useState({});
  const [sellerSum, setSellerSum] = useState({});
  const [sellerLoad, setSellerLoad] = useState(true);

  const [sellerDetailId, setSellerDetailId] = useState(null);
  const [sellerAction, setSellerAction] = useState(null); // { action, name, id }

  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModalAuction, setRejectModalAuction] = useState(null);
  const [reviewModalAuction, setReviewModalAuction] = useState(null);
  const [lightboxImages, setLightboxImages] = useState(null);

  // ── Fetch pending ──────────────────────────────────────
  const fetchPending = useCallback(async (qs) => {
    setPendingLoad(true);
    try {
      const res = await getPendingAuctions(qs);
      setPending(res.data?.auctions || []);
      setPendingPag(res.data?.pagination || {});
    } catch {
      /* silent */
    } finally {
      setPendingLoad(false);
    }
  }, []);

  // ── Fetch all ──────────────────────────────────────────
  const fetchAll = useCallback(async (qs) => {
    setAllLoad(true);
    try {
      const res = await getAllAuctions(qs);
      setAllAuctions(res.data?.auctions || []);
      setAllPag(res.data?.pagination || {});
      setAllSummary(res.data?.summary || {});
    } catch {
      /* silent */
    } finally {
      setAllLoad(false);
    }
  }, []);

  // ── Fetch sellers ──────────────────────────────────────
  const fetchSellers = useCallback(async (qs) => {
    setSellerLoad(true);
    try {
      // Since the seller hook's search is used, the query params map perfectly
      // Just need to rename "status" to "sellerStatus" for the API
      const params = new URLSearchParams(qs);
      if (params.has("status")) {
        params.set("sellerStatus", params.get("status"));
        params.delete("status");
      }
      const res = await getAllSellers(`?${params.toString()}`);
      setSellersList(res.data?.sellers || []);
      setSellerPag(res.data?.pagination || {});
      setSellerSum(res.data?.summary || {});
    } catch {
      /* silent */
    } finally {
      setSellerLoad(false);
    }
  }, []);

  // Re-fetch when pending filters change
  useEffect(() => {
    fetchPending(pendingFilters.buildQueryString());
  }, [pendingFilters.filters]); // eslint-disable-line

  // Re-fetch when all filters change
  useEffect(() => {
    fetchAll(allFilters.buildQueryString());
  }, [allFilters.filters]); // eslint-disable-line

  // Re-fetch when seller filters change
  useEffect(() => {
    fetchSellers(sellerFilters.buildQueryString());
  }, [sellerFilters.filters]); // eslint-disable-line

  // Auto-refresh pending every 60s
  useEffect(() => {
    const id = setInterval(() => {
      if (adminTab === "pending")
        fetchPending(pendingFilters.buildQueryString());
      if (adminTab === "sellers")
        fetchSellers(sellerFilters.buildQueryString());
    }, 60_000);
    return () => clearInterval(id);
  }, [adminTab, pendingFilters.filters, sellerFilters.filters]); // eslint-disable-line

  // Socket: update current bid in All tab
  useEffect(() => {
    if (!socket) return;
    const onBidUpdated = ({ auctionId, highestBid }) => {
      setAllAuctions((prev) =>
        prev.map((a) =>
          a._id === auctionId ? { ...a, currentHighestBid: highestBid } : a,
        ),
      );
    };
    socket.on("bidUpdated", onBidUpdated);
    return () => socket.off("bidUpdated", onBidUpdated);
  }, [socket]);

  // ── Approve ────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approveAuction(id, { action: "approve" });
      setPending((prev) => prev.filter((a) => a._id !== id));
      setReviewModalAuction(null);
      toast.success("✅ Auction approved successfully");
      // Refresh all tab silently
      fetchAll(allFilters.buildQueryString());
    } catch {
      toast.error("❌ Failed to approve auction");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, reason) => {
    setActionLoading(id);
    try {
      await approveAuction(id, { action: "reject", rejectionReason: reason });
      setPending((prev) => prev.filter((a) => a._id !== id));
      setRejectModalAuction(null);
      setReviewModalAuction(null);
      toast.success("Auction rejected with reason");
      fetchAll(allFilters.buildQueryString());
    } catch {
      toast.error("❌ Failed to reject auction");
    } finally {
      setActionLoading(null);
    }
  };

  const allTabs = [
    { value: "all", label: "All", count: allSummary.total },
    { value: "inactive", label: "Draft", count: allSummary.inactive },
    { value: "pending", label: "Pending", count: allSummary.pending },
    { value: "approved", label: "Approved", count: allSummary.approved },
    { value: "active", label: "Live", count: allSummary.active },
    { value: "rejected", label: "Rejected", count: allSummary.rejected },
    { value: "ended", label: "Ended", count: allSummary.ended },
  ];

  const pendingCount = pendingPag.total ?? 0;
  const pendingSellersCount = sellerSum.pending ?? 0;

  // ── Shared auction/seller cell ─────────────────────────
  const AuctionCell = ({ a }) => (
    <div className="flex items-center gap-3 min-w-0">
      <AuctionThumb auction={a} onLightbox={setLightboxImages} />
      <div className="min-w-0">
        <p
          className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[160px]"
          title={a.title}>
          {a.title}
        </p>
        <p className="text-xs text-gray-400 font-mono mt-0.5">
          #{a._id.slice(-6)}
        </p>
      </div>
    </div>
  );

  const SellerCell = ({ seller }) => (
    <div className="flex items-center gap-2 min-w-0">
      <SellerAvatar seller={seller} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {seller?.name || "—"}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
          {seller?.email || ""}
        </p>
      </div>
    </div>
  );

  const ApproveRejectBtns = ({ a, variant = "normal" }) => {
    const busy = actionLoading === a._id;
    return (
      <div className={`flex gap-1.5 ${busy ? "opacity-60" : ""}`}>
        {variant === "review" && (
          <button
            onClick={() => setReviewModalAuction(a)}
            disabled={busy}
            className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 transition disabled:cursor-not-allowed">
            Review
          </button>
        )}
        <button
          onClick={() => handleApprove(a._id)}
          disabled={busy}
          className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition disabled:cursor-not-allowed flex items-center gap-1">
          {busy && <Spinner />}Approve
        </button>
        <button
          onClick={() => setRejectModalAuction(a)}
          disabled={busy}
          className="px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 transition disabled:cursor-not-allowed">
          Reject
        </button>
      </div>
    );
  };

  return (
    <>
      {rejectModalAuction && (
        <RejectAuctionModal
          auctionId={rejectModalAuction._id}
          auctionTitle={rejectModalAuction.title}
          onClose={() => setRejectModalAuction(null)}
          onSubmit={handleReject}
        />
      )}
      {reviewModalAuction && (
        <AdminAuctionDetailsModal
          auction={reviewModalAuction}
          onClose={() => setReviewModalAuction(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={actionLoading === reviewModalAuction._id}
        />
      )}
      {lightboxImages && (
        <LightboxModal
          images={lightboxImages}
          onClose={() => setLightboxImages(null)}
        />
      )}

      <div className="space-y-6">
        {/* Admin tab toggle */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setAdminTab("pending")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 ${
              adminTab === "pending"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}>
            🕐 Pending Approvals
            {pendingCount > 0 && (
              <span
                className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                  adminTab === "pending"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-700"
                }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminTab("all")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 ${
              adminTab === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}>
            📋 All Auctions
          </button>
          <button
            onClick={() => setAdminTab("sellers")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 ${
              adminTab === "sellers"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}>
            👥 Manage Sellers
            {pendingSellersCount > 0 && (
              <span
                className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                  adminTab === "sellers"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-700 border border-amber-200 dark:border-amber-700/50"
                }`}>
                {pendingSellersCount}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB A: Pending Approvals ── */}
        {adminTab === "pending" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Pending Approvals
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {pendingCount} auction{pendingCount !== 1 ? "s" : ""} awaiting
                review
              </p>
            </div>

            <FilterBar
              filters={pendingFilters.filters}
              onFilterChange={pendingFilters}
              onReset={pendingFilters.resetFilters}
              activeCount={pendingFilters.activeFilterCount}
              role="admin"
              isLoading={pendingLoad}
            />

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <Th className="w-8">#</Th>
                      <Th>Auction</Th>
                      <Th>Seller</Th>
                      <SortTh
                        label="Base Price"
                        field="basePrice"
                        filters={pendingFilters}
                      />
                      <Th>Duration</Th>
                      <SortTh
                        label="Submitted"
                        field="createdAt"
                        filters={pendingFilters}
                      />
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pendingLoad ? (
                      <SkeletonRows cols={7} />
                    ) : pending.length === 0 ? (
                      <EmptyState
                        hasFilters={pendingFilters.activeFilterCount > 0}
                        onClearFilters={pendingFilters.resetFilters}
                        emptyTitle="No pending auctions"
                        emptySubtitle="All caught up! No auctions awaiting review."
                      />
                    ) : (
                      pending.map((a, idx) => {
                        const busy = actionLoading === a._id;
                        const rowNum =
                          (pendingFilters.filters.page - 1) *
                            pendingFilters.filters.limit +
                          idx +
                          1;
                        return (
                          <tr
                            key={a._id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${busy ? "opacity-60" : ""}`}>
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                              {rowNum}
                            </td>
                            <td className="px-4 py-3">
                              <AuctionCell a={a} />
                            </td>
                            <td className="px-4 py-3">
                              <SellerCell seller={a.seller} />
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                              ₹{a.basePrice?.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {fmtDate(a.startTime)} → {fmtDate(a.endTime)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {timeAgo(a.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <ApproveRejectBtns a={a} variant="review" />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              pagination={pendingPag}
              onPageChange={pendingFilters.setPage}
              onLimitChange={pendingFilters.setLimit}
              isLoading={pendingLoad}
            />
          </div>
        )}

        {/* ── TAB B: All Auctions ── */}
        {adminTab === "all" && (
          <div className="space-y-4">
            <SummaryCards
              summary={allSummary}
              role="admin"
              isLoading={allLoad && !allAuctions.length}
              activeStatus={allFilters.filters.status}
              onStatusClick={allFilters.setStatus}
            />

            <StatusTabs
              tabs={allTabs}
              activeTab={allFilters.filters.status}
              onChange={allFilters.setStatus}
            />

            <FilterBar
              filters={allFilters.filters}
              onFilterChange={allFilters}
              onReset={allFilters.resetFilters}
              activeCount={allFilters.activeFilterCount}
              role="admin"
              isLoading={allLoad}
            />

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <Th className="w-8">#</Th>
                      <SortTh
                        label="Auction"
                        field="createdAt"
                        filters={allFilters}
                      />
                      <Th>Seller</Th>
                      <SortTh
                        label="Bid / Base"
                        field="currentHighestBid"
                        filters={allFilters}
                      />
                      <Th>Status</Th>
                      <SortTh
                        label="Timeline"
                        field="endTime"
                        filters={allFilters}
                      />
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {allLoad ? (
                      <SkeletonRows cols={7} />
                    ) : allAuctions.length === 0 ? (
                      <EmptyState
                        hasFilters={allFilters.activeFilterCount > 0}
                        onClearFilters={allFilters.resetFilters}
                        emptyTitle="No auctions found"
                        emptySubtitle="No auctions in the system yet."
                      />
                    ) : (
                      allAuctions.map((a, idx) => {
                        const rowNum =
                          (allFilters.filters.page - 1) *
                            allFilters.filters.limit +
                          idx +
                          1;
                        const busy = actionLoading === a._id;
                        return (
                          <tr
                            key={a._id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${busy ? "opacity-60" : ""}`}>
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                              {rowNum}
                            </td>
                            <td className="px-4 py-3">
                              <AuctionCell a={a} />
                            </td>
                            <td className="px-4 py-3">
                              <SellerCell seller={a.seller} />
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-gray-400">
                                Base: ₹{a.basePrice?.toLocaleString("en-IN")}
                              </p>
                              {a.currentHighestBid > 0 && (
                                <p className="font-semibold text-sm text-indigo-600 dark:text-indigo-400 mt-0.5">
                                  ₹
                                  {a.currentHighestBid?.toLocaleString("en-IN")}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={a.status} />
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {fmtDate(a.startTime)} → {fmtDate(a.endTime)}
                            </td>
                            <td className="px-4 py-3">
                              {a.status === "pending" && (
                                <ApproveRejectBtns a={a} />
                              )}
                              {a.status === "active" && (
                                <Link
                                  to={`/auction/${a._id}`}
                                  target="_blank"
                                  className="px-3 py-1.5 text-xs font-medium text-indigo-700 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition">
                                  View Live ↗
                                </Link>
                              )}
                              {a.status === "ended" && (
                                <Link
                                  to={`/auction/${a._id}`}
                                  className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition">
                                  View
                                </Link>
                              )}
                              {a.status === "rejected" && a.rejectionReason && (
                                <span
                                  className="text-xs text-red-500 dark:text-red-400 max-w-[140px] truncate block"
                                  title={a.rejectionReason}>
                                  ⚠ {a.rejectionReason}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              pagination={allPag}
              onPageChange={allFilters.setPage}
              onLimitChange={allFilters.setLimit}
              isLoading={allLoad}
            />
          </div>
        )}

        {/* ── TAB C: Manage Sellers ── */}
        {adminTab === "sellers" && (
          <div className="space-y-4">
            <SellerDetailModal
              isOpen={!!sellerDetailId}
              onClose={() => setSellerDetailId(null)}
              sellerId={sellerDetailId}
              onAction={() => fetchSellers(sellerFilters.buildQueryString())}
            />

            {sellerAction && (
              <SellerStatusActionModal
                isOpen={true}
                onClose={() => setSellerAction(null)}
                action={sellerAction.action}
                sellerName={sellerAction.name}
                sellerId={sellerAction.id}
                onSuccess={() => fetchSellers(sellerFilters.buildQueryString())}
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                {
                  label: "Total Sellers",
                  count: sellerSum.total,
                  val: "all",
                  clr: "indigo",
                },
                {
                  label: "Not Applied",
                  count: sellerSum.unverified,
                  val: "unverified",
                  clr: "gray",
                },
                {
                  label: "Awaiting Review",
                  count: sellerSum.pending,
                  val: "pending_review",
                  clr: "yellow",
                  pulse: true,
                },
                {
                  label: "Active Sellers",
                  count: sellerSum.authorized,
                  val: "authorized",
                  clr: "green",
                },
                {
                  label: "Rejected",
                  count: sellerSum.rejected,
                  val: "rejected",
                  clr: "red",
                },
                {
                  label: "Suspended",
                  count: sellerSum.suspended,
                  val: "suspended",
                  clr: "gray",
                },
              ].map((c) => {
                const isSel = sellerFilters.filters.status === c.val;
                return (
                  <button
                    key={c.val}
                    onClick={() => sellerFilters.setStatus(c.val)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSel
                        ? `border-${c.clr}-400 bg-${c.clr}-50 dark:bg-${c.clr}-900/20`
                        : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                    }`}>
                    <p
                      className={`text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2`}>
                      {c.count ?? 0}
                      {c.pulse && (
                        <span
                          className={`w-2 h-2 rounded-full bg-${c.clr}-500 animate-pulse`}
                        />
                      )}
                    </p>
                    <p className="text-xs font-medium text-gray-500 uppercase mt-0.5">
                      {c.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Reusing FilterBar styling with minimal config */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  defaultValue={sellerFilters.filters.search}
                  onChange={(e) => sellerFilters.setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z"
                    />
                  </svg>
                </span>
              </div>
              <div className="flex-1 opacity-0 pointer-events-none hidden md:block"></div>
              <select
                value={`${sellerFilters.filters.sortBy}_${sellerFilters.filters.sortOrder}`}
                onChange={(e) => {
                  const [f, o] = e.target.value.split("_");
                  sellerFilters.setSort(f, o);
                }}
                className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shrink-0 ml-auto">
                <option value="sellerAppliedAt_desc">Applied Date</option>
                <option value="createdAt_desc">Newest Account</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <Th>Seller</Th>
                      <Th>Business Info</Th>
                      <SortTh
                        label="Applied"
                        field="sellerAppliedAt"
                        filters={sellerFilters}
                      />
                      <Th>Status</Th>
                      <Th>Auctions</Th>
                      <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sellerLoad ? (
                      <SkeletonRows cols={6} />
                    ) : sellersList.length === 0 ? (
                      (() => {
                        let title = "No sellers found";
                        let subtitle =
                          "No seller accounts matched your criteria.";
                        if (
                          sellerFilters.filters.status === "pending_review" &&
                          !sellerFilters.filters.search
                        ) {
                          title = "🎉 All caught up!";
                          subtitle = "No pending applications. All caught up!";
                        } else if (
                          sellerFilters.filters.status === "unverified" &&
                          !sellerFilters.filters.search
                        ) {
                          title = "No unverified sellers";
                          subtitle =
                            "All sellers have applied for authorization";
                        } else if (sellerFilters.filters.search) {
                          title = `No sellers match '${sellerFilters.filters.search}'`;
                        }
                        return (
                          <EmptyState
                            hasFilters={
                              !!sellerFilters.filters.search ||
                              sellerFilters.filters.status !== "all"
                            }
                            onClearFilters={sellerFilters.resetFilters}
                            emptyTitle={title}
                            emptySubtitle={subtitle}
                          />
                        );
                      })()
                    ) : (
                      sellersList.map((s) => (
                        <tr
                          key={s._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <SellerCell seller={s} />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {s.sellerProfile?.businessName || "—"}
                            </p>
                            {s.sellerProfile?.businessType && (
                              <span className="inline-block mt-0.5 text-[10px] uppercase tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-1.5 py-0.5">
                                {s.sellerProfile.businessType.replace("_", " ")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {s.sellerAppliedAt
                              ? timeAgo(s.sellerAppliedAt)
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${
                                s.sellerStatus === "authorized"
                                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50"
                                  : s.sellerStatus === "pending_review"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50"
                                    : s.sellerStatus === "rejected"
                                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50"
                                      : s.sellerStatus === "suspended"
                                        ? "bg-gray-800 text-gray-300 border-gray-700"
                                        : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                              }`}>
                              {s.sellerStatus === "pending_review" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                              )}
                              {s.sellerStatus === "authorized" && (
                                <span className="text-green-600">✓</span>
                              )}
                              {s.sellerStatus === "unverified"
                                ? "Not Applied"
                                : s.sellerStatus === "pending_review"
                                  ? "Under Review"
                                  : s.sellerStatus.charAt(0).toUpperCase() +
                                    s.sellerStatus.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {s.auctionStats?.total || 0}
                            </span>{" "}
                            total <br />
                            <span
                              className={`${(s.auctionStats?.active || 0) > 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
                              {s.auctionStats?.active || 0} active
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5 items-center">
                              {s.sellerStatus === "pending_review" && (
                                <>
                                  <button
                                    onClick={() =>
                                      setSellerAction({
                                        action: "reject",
                                        name: s.name,
                                        id: s._id,
                                      })
                                    }
                                    className="btn-sm text-red-700 bg-red-50 border-red-200 hover:bg-red-100">
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => {
                                      toast.promise(
                                        import("../services/sellerAuthApi")
                                          .then((m) =>
                                            m.updateSellerStatus(s._id, {
                                              action: "authorize",
                                            }),
                                          )
                                          .then(() =>
                                            fetchSellers(
                                              sellerFilters.buildQueryString(),
                                            ),
                                          ),
                                        {
                                          pending: "Authorizing...",
                                          success: "Seller authorized",
                                          error: "Failed to authorize",
                                        },
                                      );
                                    }}
                                    className="btn-sm text-green-700 bg-green-50 border-green-200 hover:bg-green-100">
                                    Authorize
                                  </button>
                                </>
                              )}
                              {s.sellerStatus === "authorized" && (
                                <>
                                  <button
                                    onClick={() =>
                                      setSellerAction({
                                        action: "revoke",
                                        name: s.name,
                                        id: s._id,
                                      })
                                    }
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-700 border border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700/50 dark:hover:bg-amber-900/30 transition-all shadow-sm active:scale-95">
                                    Revoke
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSellerAction({
                                        action: "suspend",
                                        name: s.name,
                                        id: s._id,
                                      })
                                    }
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 border border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-900/30 transition-all shadow-sm active:scale-95">
                                    Suspend
                                  </button>
                                </>
                              )}
                              {s.sellerStatus === "suspended" && (
                                <button
                                  onClick={() =>
                                    setSellerAction({
                                      action: "revoke",
                                      name: s.name,
                                      id: s._id,
                                    })
                                  }
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-blue-700 border border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700/50 dark:hover:bg-blue-900/30 transition-all shadow-sm active:scale-95">
                                  Reinstate
                                </button>
                              )}
                              {s.sellerStatus === "rejected" && (
                                <button
                                  onClick={() => {
                                    toast.promise(
                                      import("../services/sellerAuthApi")
                                        .then((m) =>
                                          m.updateSellerStatus(s._id, {
                                            action: "authorize",
                                          }),
                                        )
                                        .then(() =>
                                          fetchSellers(
                                            sellerFilters.buildQueryString(),
                                          ),
                                        ),
                                      {
                                        pending: "Authorizing...",
                                        success: "Seller authorized",
                                        error: "Failed to authorize",
                                      },
                                    );
                                  }}
                                  className="btn-sm text-green-700 bg-green-50 border-green-200 hover:bg-green-100">
                                  Authorize
                                </button>
                              )}
                              <button
                                onClick={() => setSellerDetailId(s._id)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800"
                                title="View Profile">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
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

            <Pagination
              pagination={sellerPag}
              onPageChange={sellerFilters.setPage}
              onLimitChange={sellerFilters.setLimit}
              isLoading={sellerLoad}
            />
            <style>{`.btn-sm { @apply px-2.5 py-1 text-xs font-medium border rounded-lg transition-colors dark:bg-opacity-20 dark:border-opacity-30; }`}</style>
          </div>
        )}
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════
// BIDDER DASHBOARD
// ══════════════════════════════════════════════════════════════════
const BidderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const filters = useDashboardFilters();

  const [bids, setBids] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchBids = useCallback(async (qs) => {
    setIsLoading(true);
    try {
      const res = await getMyBids(qs);
      setBids(res.data?.bids || []);
      setPagination(res.data?.pagination || {});
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBids(filters.buildQueryString());
  }, [filters.filters]); // eslint-disable-line

  const BIDDER_SORT_OPTIONS = [
    { value: "timestamp_desc", label: "Latest First" },
    { value: "timestamp_asc", label: "Oldest First" },
    { value: "amount_desc", label: "Amount: High to Low" },
    { value: "amount_asc", label: "Amount: Low to High" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Bid History
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Track all your bids across auctions
        </p>
      </div>

      {/* Simple filter bar for bidder */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by auction title…"
            defaultValue={filters.filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z"
              />
            </svg>
          </span>
        </div>
        <select
          value={`${filters.filters.sortBy}_${filters.filters.sortOrder}`}
          onChange={(e) => {
            const [f, o] = e.target.value.split("_");
            filters.setSort(f, o);
          }}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
          {BIDDER_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <Th className="w-8">#</Th>
                <Th>Auction</Th>
                <Th>My Bid</Th>
                <Th>Status</Th>
                <Th>Highest Bid</Th>
                <Th>Ends / Ended</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <SkeletonRows cols={7} />
              ) : bids.length === 0 ? (
                <EmptyState
                  hasFilters={!!filters.filters.search}
                  onClearFilters={() => filters.setSearch("")}
                  emptyTitle="No bids yet"
                  emptySubtitle="Start bidding on active auctions!"
                  onCreate={() => navigate("/auctions")}
                  emptyAction="Browse Auctions"
                />
              ) : (
                bids.map((bid, idx) => {
                  const a = bid.auction;
                  const rowNum =
                    (filters.filters.page - 1) * filters.filters.limit +
                    idx +
                    1;
                  const isWinner =
                    a?.status === "ended" &&
                    a?.highestBidder?.toString() === user?._id?.toString();
                  const isHighest = bid.amount === a?.currentHighestBid;
                  const isActive = a?.status === "active";
                  const endTime = a?.endTime ? new Date(a.endTime) : null;
                  const now = Date.now();
                  const msLeft = endTime ? endTime.getTime() - now : 0;
                  const hh = Math.floor(msLeft / 3_600_000);
                  const mm = Math.floor((msLeft % 3_600_000) / 60_000);
                  const ss = Math.floor((msLeft % 60_000) / 1_000);

                  return (
                    <tr
                      key={bid._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                        {rowNum}
                      </td>

                      {/* Auction */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {a?.images?.length > 0 ? (
                            <img
                              src={a.images[0].url}
                              alt={a.title}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
                          )}
                          <p
                            className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]"
                            title={a?.title}>
                            {a?.title || "—"}
                          </p>
                        </div>
                      </td>

                      {/* My bid */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                          ₹{bid.amount?.toLocaleString("en-IN")}
                        </p>
                        {isWinner && (
                          <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                            🏆 Won
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={a?.status} />
                      </td>

                      {/* Highest bid */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          ₹
                          {a?.currentHighestBid?.toLocaleString("en-IN") || "—"}
                        </p>
                        {isHighest && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ Highest
                          </span>
                        )}
                      </td>

                      {/* Ends */}
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {isActive && msLeft > 0 ? (
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-medium">
                            {String(hh).padStart(2, "0")}:
                            {String(mm).padStart(2, "0")}:
                            {String(ss).padStart(2, "0")}
                          </span>
                        ) : a?.status === "ended" ? (
                          `Ended ${timeAgo(a.endTime)}`
                        ) : (
                          fmtDate(a?.endTime)
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        {isActive ? (
                          <button
                            onClick={() => navigate(`/auction/${a?._id}`)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">
                            Join →
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/auction/${a?._id}`)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition">
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={filters.setPage}
        onLimitChange={filters.setLimit}
        isLoading={isLoading}
      />
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// ROOT DASHBOARD
// ══════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.message) {
      toast.error(location.state.message);
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
