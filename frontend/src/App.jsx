import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuctionList from "./pages/AuctionList";
import AuctionRoom from "./pages/AuctionRoom";
import Dashboard from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import Loader from "./components/Loader";

// ── Guest Route wrapper ────────────────────────────────────
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <Loader />;
  if (isAuthenticated) {
    if (user?.role === "admin" || user?.role === "seller") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/auctions" replace />;
  }
  return children;
};

// ── Protected Route wrapper ────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// ── Role Protected Route wrapper ───────────────────────────
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          message:
            "🚫 Access denied. You do not have permission to view that page.",
        }}
      />
    );
  }
  return children;
};

const RootRedirect = () => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/auctions" replace />;
  if (user?.role === "admin" || user?.role === "seller") {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/auctions" replace />;
};

// ── App layout ─────────────────────────────────────────────
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />

          <Route path="/auctions" element={<AuctionList />} />
          <Route
            path="/auction/:id"
            element={
              <RoleProtectedRoute allowedRoles={["bidder"]}>
                <AuctionRoom />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <RoleProtectedRoute allowedRoles={["bidder"]}>
                <Watchlist />
              </RoleProtectedRoute>
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

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </main>
    </div>
  );
};

// ── Root App ───────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppLayout />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
