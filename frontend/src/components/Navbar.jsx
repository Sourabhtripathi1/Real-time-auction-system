import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleBadgeColors = {
  admin: 'bg-red-100 text-red-700',
  seller: 'bg-amber-100 text-amber-700',
  bidder: 'bg-emerald-100 text-emerald-700',
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Nav links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary-600 tracking-tight">
                AuctionHub
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/auctions"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
              >
                Auctions
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/watchlist"
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                  >
                    Watchlist
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right: User info or Login/Register */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      roleBadgeColors[user?.role] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
