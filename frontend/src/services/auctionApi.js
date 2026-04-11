import API from './authApi';

export const getLiveAuctions = async () => {
  const { data } = await API.get('/auctions/live');
  return data;
};

export const getAuctionById = async (id) => {
  const { data } = await API.get(`/auctions/${id}`);
  return data;
};

export const createAuction = async (formData) => {
  const { data } = await API.post('/auctions/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const approveAuction = async (id, { action, rejectionReason }) => {
  const { data } = await API.patch(`/auctions/${id}/approve`, { action, rejectionReason });
  return data;
};

export const getPendingAuctions = async () => {
  const { data } = await API.get('/auctions/pending');
  return data;
};

export const getMyAuctions = async () => {
  const { data } = await API.get('/auctions/mine');
  return data;
};

export const submitForVerification = async (auctionId) => {
  const { data } = await API.patch(`/auctions/${auctionId}/submit`);
  return data;
};

export const updateAuction = async (auctionId, formData) => {
  const { data } = await API.patch(`/auctions/${auctionId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteAuction = async (auctionId) => {
  const { data } = await API.delete(`/auctions/${auctionId}`);
  return data;
};
