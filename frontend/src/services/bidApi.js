import API from "./authApi";

export const placeBid = async (auctionId, amount) => {
  const { data } = await API.post("/bids/place", { auctionId, amount });
  return data;
};

/**
 * getBidsByAuction
 *
 * Fetches paginated bids for an auction, most recent first.
 * page 1 = newest 20 bids; click "Load older bids" increments page.
 *
 * @param {string} auctionId
 * @param {number} page   - page number (default 1)
 * @param {number} limit  - bids per page (default 20)
 */
export const getBidsByAuction = async (auctionId, page = 1, limit = 20) => {
  const { data } = await API.get(`/bids/${auctionId}`, {
    params: { page, limit },
  });
  return data;
};
