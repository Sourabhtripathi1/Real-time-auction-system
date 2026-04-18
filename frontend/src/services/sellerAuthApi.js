import API from "./authApi";

export const submitSellerApplication = async (data) => {
  const res = await API.post("/seller/apply", data);
  return res.data;
};

export const getMySellerStatus = async () => {
  const res = await API.get("/seller/my-status");
  return res.data;
};

export const getAllSellers = async (queryString = "") => {
  const res = await API.get(`/seller/all${queryString}`);
  return res.data;
};

export const getSellerById = async (sellerId) => {
  const res = await API.get(`/seller/${sellerId}`);
  return res.data;
};

export const updateSellerStatus = async (sellerId, { action, reason }) => {
  const res = await API.patch(`/seller/${sellerId}/status`, { action, reason });
  return res.data;
};
