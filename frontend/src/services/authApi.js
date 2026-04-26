import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// ── Request interceptor: attach JWT & check expiry ───────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("tokenExpiresAt");

    if (expiresAt && Date.now() > parseInt(expiresAt)) {
      // Token expired client-side — clear before request
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiresAt");
      localStorage.removeItem("user");
      localStorage.removeItem("sellerStatus");
      
      window.dispatchEvent(new CustomEvent("auth:expired"));
      return Promise.reject(new Error("Token expired"));
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 / 403 ────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message?.toLowerCase() || "";
    const code = error.response?.data?.code || "";

    // 401 — expired/invalid token → force logout
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiresAt");
      localStorage.removeItem("user");
      localStorage.removeItem("sellerStatus");

      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.href = "/login";
      }
    }

    // 403 + blocked/suspended → show BlockedNotice via React state
    // (DO NOT redirect to /login — show full-screen notice instead)
    if (
      status === 403 &&
      (message.includes("blocked") ||
        message.includes("suspended") ||
        code === "ACCOUNT_BLOCKED" ||
        code === "ACCOUNT_SUSPENDED")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiresAt");
      localStorage.removeItem("user");
      localStorage.removeItem("sellerStatus");

      // Dispatch CustomEvent — AuthContext listens and sets isAccountBlocked
      // This is the clean React-way vs. direct DOM manipulation
      window.dispatchEvent(
        new CustomEvent("auth:blocked", {
          detail: { message: error.response?.data?.message || "Account blocked" },
        }),
      );
    }

    return Promise.reject(error);
  },
);

// ── Auth API calls ─────────────────────────────────────────
export const loginUser = async (email, password) => {
  const { data } = await API.post("/auth/login", { email, password });
  if (data?.data?.token) {
    localStorage.setItem("token", data.data.token);
    if (data.data.expiresAt) {
      localStorage.setItem("tokenExpiresAt", data.data.expiresAt);
    }
  }
  return data;
};

export const registerUser = async (name, email, password, role) => {
  const { data } = await API.post("/auth/register", {
    name,
    email,
    password,
    role,
  });
  if (data?.data?.token) {
    localStorage.setItem("token", data.data.token);
    if (data.data.expiresAt) {
      localStorage.setItem("tokenExpiresAt", data.data.expiresAt);
    }
  }
  return data;
};

export const getMe = async () => {
  const { data } = await API.get("/auth/me");
  return data;
};

export const logoutUser = async () => {
  try {
    await API.post("/auth/logout");
  } catch (err) {
    console.warn("Logout API call failed:", err.message);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiresAt");
    localStorage.removeItem("user");
    localStorage.removeItem("sellerStatus");
  }
};

export default API;
