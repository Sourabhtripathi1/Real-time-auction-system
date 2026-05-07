import API from "./authApi";

/**
 * Activity Feed API Service
 * All endpoints require authentication.
 */

// ── GET /api/activity/my ────────────────────────────────────
export const getMyActivity = async ({
  page = 1,
  limit = 20,
  type = "",
  startDate = "",
  endDate = "",
} = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (type) params.append("type", type);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const { data } = await API.get(`/activity/my?${params.toString()}`);
  return data;
};

// ── GET /api/activity/global ────────────────────────────────
export const getGlobalActivity = async ({
  page = 1,
  limit = 20,
  type = "",
} = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (type) params.append("type", type);

  const { data } = await API.get(`/activity/global?${params.toString()}`);
  return data;
};

// ── GET /api/activity/by-type/:type ────────────────────────
export const getActivityByType = async (type, { page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ page, limit });
  const { data } = await API.get(`/activity/by-type/${type}?${params.toString()}`);
  return data;
};

// ── DELETE /api/activity/:id ────────────────────────────────
export const deleteActivity = async (activityId) => {
  const { data } = await API.delete(`/activity/${activityId}`);
  return data;
};
