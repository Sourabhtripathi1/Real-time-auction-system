import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// ── Request interceptor: attach JWT ────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 ───────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sellerStatus");

      // Only redirect if not already on login/register page
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.href = "/login";
      }
    }

    if (
      error.response?.status === 403 &&
      error.response.data?.message?.toLowerCase().includes("suspended")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sellerStatus");

      document.body.innerHTML = `
         <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #111827; color: white; font-family: system-ui, sans-serif; text-align: center; padding: 20px;">
            <div style="width: 64px; height: 64px; background: #991b1b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 24px;">⚠</div>
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Account Suspended</h1>
            <p style="color: #9ca3af; margin-bottom: 24px;">Your account has been suspended. Please contact support.</p>
            <button onclick="window.location.href='/login'" style="background: #374151; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">Logout</button>
         </div>
       `;
    }

    return Promise.reject(error);
  },
);

// ── Auth API calls ─────────────────────────────────────────
export const loginUser = async (email, password) => {
  const { data } = await API.post("/auth/login", { email, password });
  return data;
};

export const registerUser = async (name, email, password, role) => {
  const { data } = await API.post("/auth/register", {
    name,
    email,
    password,
    role,
  });
  return data;
};

export const getMe = async () => {
  const { data } = await API.get("/auth/me");
  return data;
};

export default API;
