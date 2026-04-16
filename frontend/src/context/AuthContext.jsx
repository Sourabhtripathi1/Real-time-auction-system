import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);

  // ── On mount: validate stored token + refresh user object ─
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser  = localStorage.getItem('user');

      if (!storedToken) { setLoading(false); return; }

      try {
        // Re-fetch full user from server to get latest profileImage etc.
        const res = await getMe();
        const freshUser = res.data;
        setToken(storedToken);
        setUser(freshUser);
        setProfileImage(freshUser?.profileImage?.url || null);
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch (err) {
        // 401 or network error — clear everything
        if (err.response?.status === 401 || storedUser) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        setToken(null);
        setUser(null);
        setProfileImage(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setProfileImage(userData?.profileImage?.url || null);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setProfileImage(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  // Update avatar in navbar immediately after profile image upload / remove
  const updateProfileImage = useCallback((url) => {
    setProfileImage(url ?? null);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, profileImage: url ? { url } : null };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Update name in navbar immediately after profile edit
  const updateUserName = useCallback((name) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        profileImage,
        login,
        logout,
        isAuthenticated,
        updateProfileImage,
        updateUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
