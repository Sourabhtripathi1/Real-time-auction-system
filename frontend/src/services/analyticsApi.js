import API from "./authApi";

/**
 * Analytics API Service
 * All endpoints require authentication and admin role.
 */

// ── GET /api/analytics/overview ───────────────────────────────
export const getOverviewMetrics = async () => {
  const { data } = await API.get("/analytics/overview");
  return data;
};

// ── GET /api/analytics/revenue-by-day ─────────────────────────
export const getRevenueByDay = async (days = 30) => {
  const { data } = await API.get(`/analytics/revenue-by-day?days=${days}`);
  return data;
};

// ── GET /api/analytics/auctions-by-status ─────────────────────
export const getAuctionsByStatus = async () => {
  const { data } = await API.get("/analytics/auctions-by-status");
  return data;
};

// ── GET /api/analytics/bid-frequency ──────────────────────────
export const getBidFrequency = async (days = 7) => {
  const { data } = await API.get(`/analytics/bid-frequency?days=${days}`);
  return data;
};

// ── GET /api/analytics/top-auctions ───────────────────────────
export const getTopAuctions = async (limit = 10) => {
  const { data } = await API.get(`/analytics/top-auctions?limit=${limit}`);
  return data;
};

// ── GET /api/analytics/user-growth ────────────────────────────
export const getUserGrowth = async (days = 30) => {
  const { data } = await API.get(`/analytics/user-growth?days=${days}`);
  return data;
};
