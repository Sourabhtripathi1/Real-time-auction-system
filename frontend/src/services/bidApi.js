import API from "./authApi";

export const placeBid = async (auctionId, amount) => {
  const { data } = await API.post("/bids/place", { auctionId, amount });
  return data;
};

export const getBidsByAuction = async (auctionId) => {
  const { data } = await API.get(`/bids/${auctionId}`);
  return data;
};
