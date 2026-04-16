import API from './authApi';

export const getProfile = async () => {
  const { data } = await API.get('/profile/me');
  return data; // { success, data: { user, stats } }
};

export const updateProfile = async (formData) => {
  const { data } = await API.patch('/profile/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const changePassword = async (payload) => {
  const { data } = await API.patch('/profile/change-password', payload);
  return data;
};

export const removeProfileImage = async () => {
  const { data } = await API.delete('/profile/remove-image');
  return data;
};
