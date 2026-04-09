import API from './authApi';

export const addToWatchlist = async (auctionId) => {
  const { data } = await API.post('/watchlist/add', { auctionId });
  return data;
};

export const getMyWatchlist = async () => {
  const { data } = await API.get('/watchlist/my');
  return data;
};

export const removeFromWatchlist = async (auctionId) => {
  const { data } = await API.delete(`/watchlist/${auctionId}`);
  return data;
};
