import { useAuth } from "../context/AuthContext";

/**
 * BlockedNotice — Full-screen account blocked overlay.
 *
 * Rendered by App.jsx when isAccountBlocked === true.
 * The user CANNOT dismiss this — they must contact support or logout.
 * No navigation is exposed; no escape route exists.
 */
const BlockedNotice = ({ message }) => {
  const { logout } = useAuth();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900">
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 text-center">
        {/* Ban Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">
          Account Blocked
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
          {message ||
            "Your account has been blocked by an administrator. Please contact support for assistance."}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
          If you believe this is a mistake, please reach out to our support
          team.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@auctionsystem.com"
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
            Contact Support
          </a>
          <button
            onClick={logout}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-colors">
            Logout
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-6">
          Reference ID: {Date.now().toString(36).toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default BlockedNotice;
