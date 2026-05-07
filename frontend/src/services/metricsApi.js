import API from "./authApi";

/**
 * Auction Metrics API Service
 */

// ── GET /api/auctions/:id/metrics ──────────────────────────────
export const getAuctionMetrics = async (auctionId) => {
  const { data } = await API.get(`/auctions/${auctionId}/metrics`);
  return data;
};

// ── GET /api/auctions/seller/performance ───────────────────────
export const getSellerMetrics = async () => {
  const { data } = await API.get("/auctions/seller/performance");
  return data;
};
