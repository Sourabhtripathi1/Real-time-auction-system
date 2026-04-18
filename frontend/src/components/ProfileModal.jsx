import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import useProfile from "../hooks/useProfile";
import SellerApplicationModal from "./seller/SellerApplicationModal";

// ── Helpers ────────────────────────────────────────────────
const pad2 = (n) => String(n).padStart(2, "0");
const formatMemberSince = (d) =>
  new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

const timeAgo = (d) => {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const passwordStrength = (pw) => {
  if (!pw) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score === 1) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score === 2)
    return { label: "Medium", color: "bg-amber-500", width: "66%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
};

// ── Eye Icon ───────────────────────────────────────────────
const EyeIcon = ({ show }) =>
  show ? (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  ) : (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );

// ── Password Input ─────────────────────────────────────────
const PasswordInput = ({ id, label, value, onChange, placeholder, error }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
          <EyeIcon show={show} />
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────
const StatCard = ({ label, value }) => (
  <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-3 text-center">
    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
      {value ?? 0}
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
  </div>
);

// ── Field ──────────────────────────────────────────────────
const Field = ({ label, id, children }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 dark:placeholder-gray-500";
const disabledCls =
  "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed";

// ═══════════════════════════════════════════════════════════
// PROFILE MODAL
// ═══════════════════════════════════════════════════════════
const ProfileModal = ({ onClose }) => {
  const { user, sellerStatus } = useAuth();
  const {
    profile,
    loading,
    error,
    updating,
    passwordLoading,
    fetchProfile,
    handleUpdateProfile,
    handleChangePassword,
    handleRemoveImage,
  } = useProfile();

  const [activeTab, setActiveTab] = useState("personal");
  const [appModalMode, setAppModalMode] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showCloseWarn, setShowCloseWarn] = useState(false);
  const fileInputRef = useRef(null);

  // ── Personal tab form state ────────────────────────────
  const [personalForm, setPersonalForm] = useState({
    name: "",
    contactNumber: "",
  });
  // ── Address tab form state ─────────────────────────────
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [sellerProfileForm, setSellerProfileForm] = useState({
    businessName: "",
    businessType: "",
    description: "",
    website: "",
  });
  // ── Security tab form state ────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Populate forms when profile loads (only once)
  useEffect(() => {
    if (!profile?.user) return;
    const u = profile.user;
    setPersonalForm({
      name: u.name || "",
      contactNumber: u.contactNumber || "",
    });
    setAddressForm({
      street: u.address?.street || "",
      city: u.address?.city || "",
      state: u.address?.state || "",
      pincode: u.address?.pincode || "",
      country: u.address?.country || "India",
    });
    setSellerProfileForm({
      businessName: u.sellerProfile?.businessName || "",
      businessType: u.sellerProfile?.businessType || "",
      description: u.sellerProfile?.description || "",
      website: u.sellerProfile?.website || "",
    });
  }, [profile?.user?._id]); // only re-populate when user identity changes

  // ── Attempt to close — guard against unsaved changes ──
  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowCloseWarn(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  const discardAndClose = () => {
    setIsDirty(false);
    setShowCloseWarn(false);
    onClose();
  };

  // Escape key / scroll lock
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [requestClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) requestClose();
  };

  // ── Live profileCompletion calculation ─────────────────
  const liveCompletion = (() => {
    const u = profile?.user;
    if (!u) return 0;
    let s = 0;
    if (personalForm.name || u.name) s += 20;
    if (personalForm.contactNumber || u.contactNumber) s += 20;
    if (u.profileImage?.url) s += 20;
    if (addressForm.city || u.address?.city) s += 20;
    if (addressForm.state || u.address?.state) s += 20;
    return s;
  })();

  // ── Avatar upload (immediate) ──────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile image must not exceed 2MB");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only jpg, png, webp images allowed");
      return;
    }

    setAvatarUploading(true);
    const fd = new FormData();
    fd.append("profileImage", file);
    const result = await handleUpdateProfile(fd);
    if (result.success) {
      toast.success("✅ Profile photo updated");
      await fetchProfile();
    } else {
      toast.error(result.error);
    }
    setAvatarUploading(false);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  // ── Remove avatar ──────────────────────────────────────
  const onRemoveImage = async () => {
    setRemoveConfirm(false);
    const result = await handleRemoveImage();
    if (result.success) {
      toast.success("Profile photo removed");
      await fetchProfile();
    } else {
      toast.error(result.error);
    }
  };

  // ── Save personal info ─────────────────────────────────
  const savePersonal = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    if (personalForm.name) fd.append("name", personalForm.name);
    if (personalForm.contactNumber)
      fd.append("contactNumber", personalForm.contactNumber);
    const result = await handleUpdateProfile(fd);
    if (result.success) {
      toast.success("✅ Profile updated successfully");
      setIsDirty(false);
      await fetchProfile();
    } else {
      toast.error(result.error);
    }
  };

  // ── Save address ───────────────────────────────────────
  const saveAddress = async (e) => {
    e.preventDefault();
    if (addressForm.pincode && !/^[0-9]{6}$/.test(addressForm.pincode)) {
      toast.error("Pincode must be 6 digits");
      return;
    }
    const fd = new FormData();
    Object.entries(addressForm).forEach(([k, v]) => {
      if (v) fd.append(`address[${k}]`, v);
    });
    const result = await handleUpdateProfile(fd);
    if (result.success) {
      toast.success("✅ Address saved");
      setIsDirty(false);
      await fetchProfile();
    } else {
      toast.error(result.error);
    }
  };

  // ── Save business profile ──────────────────────────────
  const saveBusinessProfile = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(sellerProfileForm).forEach(([k, v]) => {
      if (v) fd.append(`sellerProfile[${k}]`, v);
    });
    const result = await handleUpdateProfile(fd);
    if (result.success) {
      toast.success("✅ Business profile saved");
      setIsDirty(false);
      await fetchProfile();
    } else {
      toast.error(result.error);
    }
  };

  // ── Change password ────────────────────────────────────
  const savePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = "Required";
    if (!pwForm.newPassword) errs.newPassword = "Required";
    else if (pwForm.newPassword.length < 8)
      errs.newPassword = "At least 8 characters";
    if (!pwForm.confirmPassword) errs.confirmPassword = "Required";
    else if (pwForm.newPassword !== pwForm.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length) {
      setPwErrors(errs);
      return;
    }
    setPwErrors({});

    const result = await handleChangePassword(pwForm);
    if (result.success) {
      toast.success("✅ Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      toast.error(result.error);
    }
  };

  const u = profile?.user;
  const stats = profile?.stats || {};
  const strength = passwordStrength(pwForm.newPassword);
  const roleBadge = {
    admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    seller: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    bidder:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  };
  const TABS = [
    { key: "personal", label: "Personal Info" },
    { key: "address", label: "Address" },
    { key: "security", label: "Security" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={handleBackdropClick}>
      <SellerApplicationModal
        isOpen={!!appModalMode}
        onClose={() => setAppModalMode(null)}
        mode={appModalMode}
        existingData={{ sellerProfile: sellerProfileForm }}
        onSuccess={() => {
          setAppModalMode(null);
          onClose();
        }}
      />
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        {/* Unsaved changes warning banner */}
        {showCloseWarn && (
          <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              ⚠ You have unsaved changes. Are you sure you want to close?
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={discardAndClose}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Discard Changes
              </button>
              <button
                onClick={() => setShowCloseWarn(false)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">
                Keep Editing
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h2>
            {u && (
              <span
                className={`mt-1 inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${roleBadge[u.role] || ""}`}>
                {u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
              </span>
            )}
          </div>
          <button
            onClick={requestClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchProfile}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition">
              Retry
            </button>
          </div>
        ) : u ? (
          <div className="px-6 pb-8">
            {/* Avatar section */}
            <div className="flex flex-col items-center mt-6 mb-2">
              <div className="relative">
                {avatarUploading ? (
                  <div className="w-24 h-24 rounded-full ring-4 ring-indigo-100 dark:ring-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : u.profileImage?.url ? (
                  <img
                    src={u.profileImage.url}
                    alt="avatar"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-100 dark:ring-indigo-900/50"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full ring-4 ring-indigo-100 dark:ring-indigo-900/50 bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Camera button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition"
                  aria-label="Change photo">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* Remove photo */}
              {u.profileImage?.url && (
                <div className="mt-2 text-center">
                  {removeConfirm ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Are you sure?
                      </span>
                      <button
                        onClick={onRemoveImage}
                        className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline">
                        Yes, remove
                      </button>
                      <button
                        onClick={() => setRemoveConfirm(false)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRemoveConfirm(true)}
                      className="text-xs text-red-500 dark:text-red-400 underline hover:text-red-700 dark:hover:text-red-300 mt-1">
                      Remove Photo
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Profile completion banner */}
            <div className="mt-4 mb-6 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  Profile Completion
                </span>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  {liveCompletion}%
                </span>
              </div>
              <div className="w-full h-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${liveCompletion}%` }}
                />
              </div>
              {liveCompletion < 100 && (
                <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1.5">
                  Complete your profile to build trust with buyers and sellers
                </p>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── TAB 1: Personal Info ─────────────────── */}
            {activeTab === "personal" && (
              <>
                <form onSubmit={savePersonal} className="space-y-5">
                  {/* Read-only info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="email" label="Email">
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          value={u.email}
                          disabled
                          className={disabledCls}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </Field>
                    <Field id="role-field" label="Role">
                      <input
                        id="role-field"
                        type="text"
                        value={u.role}
                        disabled
                        className={disabledCls}
                      />
                    </Field>
                    <Field id="member-since" label="Member Since">
                      <input
                        id="member-since"
                        type="text"
                        value={formatMemberSince(u.createdAt)}
                        disabled
                        className={disabledCls}
                      />
                    </Field>
                    <Field id="last-login" label="Last Login">
                      <input
                        id="last-login"
                        type="text"
                        value={timeAgo(u.lastLogin)}
                        disabled
                        className={disabledCls}
                      />
                    </Field>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  {/* Editable fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="name" label="Full Name">
                      <input
                        id="name"
                        type="text"
                        value={personalForm.name}
                        onChange={(e) => {
                          setPersonalForm((p) => ({
                            ...p,
                            name: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        placeholder="Your full name"
                        minLength={2}
                        maxLength={50}
                        className={inputCls}
                      />
                    </Field>
                    <Field id="contact" label="Contact Number">
                      <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400 transition">
                        <span className="px-3 text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 py-2.5">
                          🇮🇳
                        </span>
                        <input
                          id="contact"
                          type="tel"
                          value={personalForm.contactNumber}
                          onChange={(e) => {
                            setPersonalForm((p) => ({
                              ...p,
                              contactNumber: e.target.value,
                            }));
                            setIsDirty(true);
                          }}
                          placeholder="10-15 digit number"
                          className="flex-1 px-3 py-2.5 text-sm text-gray-900 dark:text-white bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                    </Field>
                  </div>

                  {/* Stats */}
                  {u.role === "seller" && (
                    <div className="grid grid-cols-3 gap-3">
                      <StatCard
                        label="Total Auctions"
                        value={stats.totalAuctions}
                      />
                      <StatCard
                        label="Active Auctions"
                        value={stats.activeAuctions}
                      />
                      <StatCard label="Pending" value={stats.pendingAuctions} />
                    </div>
                  )}
                  {u.role === "bidder" && (
                    <div className="grid grid-cols-3 gap-3">
                      <StatCard label="Total Bids" value={stats.totalBids} />
                      <StatCard
                        label="Auctions Won"
                        value={stats.auctionsWon}
                      />
                      <StatCard
                        label="Watchlist"
                        value={stats.watchlistCount}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {updating && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    Save Changes
                  </button>
                </form>

                {/* SELLER STATUS INFO BLOCK */}
                {u.role === "seller" && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                      Seller Authorization
                    </h3>

                    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            sellerStatus === "authorized"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                              : sellerStatus === "pending_review"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                                : sellerStatus === "rejected"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                  : sellerStatus === "suspended"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}>
                          {sellerStatus === "unverified"
                            ? "Not Applied"
                            : sellerStatus === "pending_review"
                              ? "Under Review"
                              : sellerStatus?.charAt(0).toUpperCase() +
                                  sellerStatus?.slice(1) || "Unknown"}
                        </span>
                        {sellerStatus === "authorized" && (
                          <span className="text-sm text-gray-500">
                            You are fully authorized to create auctions.
                          </span>
                        )}
                        {sellerStatus === "pending_review" && (
                          <span className="text-sm text-gray-500">
                            Your application submitted on{" "}
                            {formatMemberSince(u.sellerAppliedAt)} is under
                            review.
                          </span>
                        )}
                        {sellerStatus === "suspended" && (
                          <span className="text-sm text-red-500 font-medium">
                            Your account has been suspended. Please contact
                            support.
                          </span>
                        )}
                      </div>

                      {(sellerStatus === "unverified" ||
                        sellerStatus === "rejected" ||
                        !sellerStatus) && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 mt-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">
                            Complete Seller Profile
                          </h4>
                          <form
                            onSubmit={saveBusinessProfile}
                            className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Field id="bizName" label="Business Name">
                                <input
                                  type="text"
                                  value={sellerProfileForm.businessName}
                                  onChange={(e) => {
                                    setSellerProfileForm((p) => ({
                                      ...p,
                                      businessName: e.target.value,
                                    }));
                                    setIsDirty(true);
                                  }}
                                  className={inputCls}
                                  placeholder="Business Name"
                                />
                              </Field>
                              <Field id="bizType" label="Business Type">
                                <select
                                  value={sellerProfileForm.businessType}
                                  onChange={(e) => {
                                    setSellerProfileForm((p) => ({
                                      ...p,
                                      businessType: e.target.value,
                                    }));
                                    setIsDirty(true);
                                  }}
                                  className={inputCls}>
                                  <option value="">Select...</option>
                                  <option value="individual">Individual</option>
                                  <option value="small_business">
                                    Small Business
                                  </option>
                                  <option value="company">Company</option>
                                  <option value="other">Other</option>
                                </select>
                              </Field>
                              <div className="sm:col-span-2">
                                <Field id="bizDesc" label="What do you sell?">
                                  <textarea
                                    rows={3}
                                    value={sellerProfileForm.description}
                                    onChange={(e) => {
                                      setSellerProfileForm((p) => ({
                                        ...p,
                                        description: e.target.value,
                                      }));
                                      setIsDirty(true);
                                    }}
                                    className={inputCls}
                                    placeholder="Electronics, art..."
                                  />
                                </Field>
                              </div>
                              <div className="sm:col-span-2">
                                <Field id="bizWeb" label="Website (optional)">
                                  <input
                                    type="url"
                                    value={sellerProfileForm.website}
                                    onChange={(e) => {
                                      setSellerProfileForm((p) => ({
                                        ...p,
                                        website: e.target.value,
                                      }));
                                      setIsDirty(true);
                                    }}
                                    className={inputCls}
                                    placeholder="https://..."
                                  />
                                </Field>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-3">
                              <button
                                type="submit"
                                disabled={updating}
                                className="px-4 py-2 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 flex-1">
                                {updating && (
                                  <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin mr-2 inline-block" />
                                )}
                                Save Draft Profile
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setAppModalMode(
                                    sellerStatus === "rejected"
                                      ? "reapply"
                                      : "apply",
                                  )
                                }
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex-1">
                                Submit for Authorization
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── TAB 2: Address ───────────────────────── */}
            {activeTab === "address" && (
              <form onSubmit={saveAddress} className="space-y-4">
                <Field id="street" label="Street Address">
                  <input
                    id="street"
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => {
                      setAddressForm((p) => ({ ...p, street: e.target.value }));
                      setIsDirty(true);
                    }}
                    placeholder="House no., street, area"
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field id="city" label="City">
                    <input
                      id="city"
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => {
                        setAddressForm((p) => ({ ...p, city: e.target.value }));
                        setIsDirty(true);
                      }}
                      placeholder="City"
                      className={inputCls}
                    />
                  </Field>
                  <Field id="state" label="State">
                    <input
                      id="state"
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => {
                        setAddressForm((p) => ({
                          ...p,
                          state: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      placeholder="State"
                      className={inputCls}
                    />
                  </Field>
                  <Field id="pincode" label="Pincode">
                    <input
                      id="pincode"
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) => {
                        setAddressForm((p) => ({
                          ...p,
                          pincode: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className={inputCls}
                    />
                  </Field>
                  <Field id="country" label="Country">
                    <input
                      id="country"
                      type="text"
                      value={addressForm.country}
                      onChange={(e) => {
                        setAddressForm((p) => ({
                          ...p,
                          country: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      placeholder="Country"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {updating && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Save Address
                </button>
              </form>
            )}

            {/* ── TAB 3: Security ──────────────────────── */}
            {activeTab === "security" && (
              <div className="space-y-8">
                <form onSubmit={savePassword} className="space-y-4">
                  <PasswordInput
                    id="currentPw"
                    label="Current Password"
                    value={pwForm.currentPassword}
                    onChange={(e) =>
                      setPwForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Your current password"
                    error={pwErrors.currentPassword}
                  />

                  <div>
                    <PasswordInput
                      id="newPw"
                      label="New Password"
                      value={pwForm.newPassword}
                      onChange={(e) =>
                        setPwForm((p) => ({
                          ...p,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="At least 8 characters"
                      error={pwErrors.newPassword}
                    />
                    {pwForm.newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Strength
                          </span>
                          <span
                            className={`text-xs font-medium ${strength.color.replace("bg-", "text-")}`}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                            style={{ width: strength.width }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <PasswordInput
                      id="confirmPw"
                      label="Confirm New Password"
                      value={pwForm.confirmPassword}
                      onChange={(e) =>
                        setPwForm((p) => ({
                          ...p,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Re-enter new password"
                      error={pwErrors.confirmPassword}
                    />
                    {pwForm.confirmPassword &&
                      pwForm.newPassword === pwForm.confirmPassword && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Passwords match
                        </p>
                      )}
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {passwordLoading && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    Update Password
                  </button>
                </form>

                {/* Danger zone / account info */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                    Account Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Last login
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {timeAgo(u.lastLogin)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Email verification
                      </span>
                      {u.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Email Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                          ⚠ Not Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProfileModal;
