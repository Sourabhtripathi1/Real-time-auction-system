import API from './authApi';

// ── Seller ─────────────────────────────────────────────────
export const getMyAuctions = async (queryString = '') => {
  const { data } = await API.get(`/auctions/mine${queryString}`);
  return data; // { success, data: { auctions, pagination, summary } }
};

// ── Admin ──────────────────────────────────────────────────
export const getPendingAuctions = async (queryString = '') => {
  const { data } = await API.get(`/auctions/pending${queryString}`);
  return data; // { success, data: { auctions, pagination } }
};

export const getAllAuctions = async (queryString = '') => {
  const { data } = await API.get(`/auctions/all${queryString}`);
  return data; // { success, data: { auctions, pagination, summary } }
};

// ── Bidder ─────────────────────────────────────────────────
export const getMyBids = async (queryString = '') => {
  const { data } = await API.get(`/bids/my-bids${queryString}`);
  return data; // { success, data: { bids, pagination } }
};
