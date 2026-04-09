import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AuctionList from './pages/AuctionList';
import AuctionRoom from './pages/AuctionRoom';
import Dashboard from './pages/Dashboard';
import Watchlist from './pages/Watchlist';
import Loader from './components/Loader';

// ── Protected Route wrapper ────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/auctions" replace />;
  }

  return children;
};

// ── App layout with Navbar ─────────────────────────────────
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/auctions" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auctions" element={<AuctionList />} />

          {/* Protected */}
          <Route
            path="/auction/:id"
            element={
              <ProtectedRoute>
                <AuctionRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/auctions" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// ── Root App ───────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppLayout />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
