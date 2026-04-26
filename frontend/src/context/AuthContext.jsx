import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getMe, logoutUser } from "../services/authApi";
import { getMySellerStatus } from "../services/sellerAuthApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [sellerStatus, setSellerStatus] = useState(null);
  const [isAccountBlocked, setIsAccountBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");

  // ── On mount: validate stored token + refresh user object ─
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // Re-fetch full user from server to get latest profileImage etc.
        const res = await getMe();
        const freshUser = res.data;
        setToken(storedToken);
        setUser(freshUser);
        setProfileImage(freshUser?.profileImage?.url || null);
        localStorage.setItem("user", JSON.stringify(freshUser));

        if (freshUser.role === "seller") {
          // Silently fetch seller status
          getMySellerStatus()
            .then((sRes) => {
              setSellerStatus(sRes.data.sellerStatus);
              localStorage.setItem("sellerStatus", sRes.data.sellerStatus);
            })
            .catch(() => {
              /* ignore */
            });
        }

        // Also check if existing sellerStatus exists in localstorage as fallback
        const storedStatus = localStorage.getItem("sellerStatus");
        if (storedStatus) setSellerStatus(storedStatus);
      } catch (err) {
        // 401 or network error — clear everything
        if (err.response?.status === 401 || storedUser) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("sellerStatus");
        }
        setToken(null);
        setUser(null);
        setProfileImage(null);
        setSellerStatus(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Listen for blocked account events dispatched by the Axios interceptor
  useEffect(() => {
    const handleBlocked = (e) => {
      setIsAccountBlocked(true);
      setBlockedMessage(e.detail?.message || "Your account has been blocked.");
    };
    window.addEventListener("auth:blocked", handleBlocked);
    return () => window.removeEventListener("auth:blocked", handleBlocked);
  }, []);

  // Listen for token expiry events
  useEffect(() => {
    const handleExpiry = () => {
      logout();
      window.dispatchEvent(
        new CustomEvent("toast:show", {
          detail: {
            message: "Session expired. Please login again.",
            type: "warning",
          },
        }),
      );
    };
    window.addEventListener("auth:expired", handleExpiry);
    return () => window.removeEventListener("auth:expired", handleExpiry);
  }, []);

  // 5-minute expiry warning
  useEffect(() => {
    const expiresAt = localStorage.getItem("tokenExpiresAt");
    if (!expiresAt || !token) return;

    const timeUntilExpiry = parseInt(expiresAt) - Date.now();
    const warningTime = timeUntilExpiry - 5 * 60 * 1000;

    if (warningTime > 0) {
      const timer = setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("toast:show", {
            detail: {
              message: "Your session expires in 5 minutes. Please save your work.",
              type: "warning",
              duration: 8000,
            },
          }),
        );
      }, warningTime);
      return () => clearTimeout(timer);
    }
  }, [token]);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setProfileImage(userData?.profileImage?.url || null);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));

    if (userData.role === "seller") {
      getMySellerStatus()
        .then((sRes) => {
          setSellerStatus(sRes.data.sellerStatus);
          localStorage.setItem("sellerStatus", sRes.data.sellerStatus);
        })
        .catch(() => {
          /* ignore */
        });
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setToken(null);
    setProfileImage(null);
    setSellerStatus(null);
    window.location.href = "/login";
  }, []);

  // Update avatar in navbar immediately after profile image upload / remove
  const updateProfileImage = useCallback((url) => {
    setProfileImage(url ?? null);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, profileImage: url ? { url } : null };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Update name in navbar immediately after profile edit
  const updateUserName = useCallback((name) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Update sellerStatus
  const updateSellerStatus = useCallback((status) => {
    setSellerStatus(status);
    if (status) localStorage.setItem("sellerStatus", status);
    else localStorage.removeItem("sellerStatus");
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        profileImage,
        sellerStatus,
        isAccountBlocked,
        blockedMessage,
        login,
        logout,
        isAuthenticated,
        updateProfileImage,
        updateUserName,
        updateSellerStatus,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export default AuthContext;
