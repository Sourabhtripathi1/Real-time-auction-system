import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ProfileModal from "./ProfileModal";
import SellerApplicationModal from "./seller/SellerApplicationModal";

// ── Role badge colours ─────────────────────────────────────
const roleBadgeColors = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  seller: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  bidder:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

// ── Icons ──────────────────────────────────────────────────
const SunIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const UserCircleIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

// ── Avatar ─────────────────────────────────────────────────
const Avatar = ({ user, profileImage, size = "sm" }) => {
  const dim = size === "sm" ? "w-9 h-9 text-sm" : "w-10 h-10 text-sm";
  return profileImage ? (
    <img
      src={profileImage}
      alt="avatar"
      className={`${dim} rounded-full object-cover ring-2 ring-indigo-500 dark:ring-indigo-400 cursor-pointer flex-shrink-0`}
    />
  ) : (
    <div
      className={`${dim} rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center ring-2 ring-indigo-400 dark:ring-indigo-500 text-white font-semibold cursor-pointer flex-shrink-0`}>
      {user?.name?.charAt(0).toUpperCase() || "?"}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
const Navbar = () => {
  const { user, profileImage, isAuthenticated, logout, sellerStatus } =
    useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [appModalMode, setAppModalMode] = useState(null);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setIsDropdownOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Profile completion for dropdown bar
  const completion = (() => {
    if (!user) return 0;
    let s = 0;
    if (user.name) s += 20;
    if (user.contactNumber) s += 20;
    if (user.profileImage?.url) s += 20;
    if (user.address?.city) s += 20;
    if (user.address?.state) s += 20;
    return s;
  })();

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-sm dark:shadow-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Nav links */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 dark:group-hover:bg-indigo-600 transition-colors">
                  <span className="text-white text-xs font-bold">AH</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  AuctionHub
                </span>
              </Link>

              <div className="hidden sm:flex items-center gap-1">
                {(!isAuthenticated || user?.role === "bidder") && (
                  <Link
                    to="/auctions"
                    className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all">
                    Auctions
                  </Link>
                )}
                {isAuthenticated && (
                  <Link
                    to="/dashboard"
                    className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all">
                    Dashboard
                  </Link>
                )}
                {isAuthenticated && (
                  <Link
                    to="/activity"
                    className="relative px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Activity
                  </Link>
                )}
                {isAuthenticated && user?.role === "bidder" && (
                  <Link
                    to="/watchlist"
                    className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all">
                    Watchlist
                  </Link>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                <span
                  className={`absolute transition-all duration-300 ${isDark ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}`}>
                  <SunIcon />
                </span>
                <span
                  className={`absolute transition-all duration-300 ${isDark ? "opacity-0 rotate-90" : "opacity-100 rotate-0"}`}>
                  <MoonIcon />
                </span>
              </button>

              {isAuthenticated ? (
                /* ── Avatar Dropdown ─────────────────────────── */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen((o) => !o)}
                    aria-label="Open user menu"
                    aria-expanded={isDropdownOpen}>
                    <Avatar user={user} profileImage={profileImage} size="sm" />
                  </button>

                  {/* Dropdown Panel */}
                  <div
                    className={`absolute right-0 top-12 w-60 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden transition-all duration-200 origin-top-right ${
                      isDropdownOpen
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}>
                    {/* User info header */}
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                      <Avatar
                        user={user}
                        profileImage={profileImage}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email}
                        </p>
                        <span
                          className={`mt-1 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeColors[user?.role] || ""}`}>
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    {/* Profile completion bar */}
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Profile
                        </span>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {completion}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>

                    {/* Seller Status Row */}
                    {user?.role === "seller" && (
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                        {sellerStatus === "authorized" && (
                          <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                            <span className="shrink-0">✓</span> Authorized
                            Seller
                          </div>
                        )}
                        {sellerStatus === "pending_review" && (
                          <div className="flex items-center gap-2 text-xs font-medium text-yellow-600 dark:text-yellow-500">
                            <span className="shrink-0 animate-pulse">⏳</span>{" "}
                            Application Pending
                          </div>
                        )}
                        {sellerStatus === "rejected" && (
                          <div className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
                            <span className="shrink-0">✗</span> Application
                            Rejected
                          </div>
                        )}
                        {sellerStatus === "suspended" && (
                          <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400">
                            <span className="shrink-0">⚠</span> Account
                            Suspended
                          </div>
                        )}
                        {(sellerStatus === "unverified" || !sellerStatus) && (
                          <button
                            onClick={() => {
                              setAppModalMode("apply");
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 w-full text-left">
                            <span className="shrink-0">+</span> Apply for Seller
                            Auth
                          </button>
                        )}
                      </div>
                    )}

                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileModalOpen(true);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left">
                        <span className="text-gray-400 dark:text-gray-500">
                          <UserCircleIcon />
                        </span>
                        My Profile
                      </button>

                      <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
                        <span className="text-red-400 dark:text-red-500">
                          <LogoutIcon />
                        </span>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg transition-all shadow-sm">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
      )}

      {/* Seller Application Modal from Navbar */}
      <SellerApplicationModal
        isOpen={!!appModalMode}
        onClose={() => setAppModalMode(null)}
        mode={appModalMode}
        onSuccess={() => setAppModalMode(null)}
      />
    </>
  );
};

export default Navbar;
