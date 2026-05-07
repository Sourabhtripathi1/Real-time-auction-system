import { useState, useEffect, useCallback, useRef } from "react";
import { getMyActivity, getGlobalActivity } from "../services/activityApi";

/**
 * useActivity — manages fetching, pagination, and real-time prepending
 * of user or global activity feeds.
 *
 * @param {("my"|"global")} feedType  — which endpoint to call
 * @param {object}          filters   — { type, startDate, endDate }
 */
const useActivity = (feedType = "my", filters = {}) => {
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track whether a fetch is already in-flight (prevents duplicate requests)
  const isFetchingRef = useRef(false);

  // ── Fetch page 1 (reset) ──────────────────────────────────
  const fetchActivities = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const fetcher = feedType === "global" ? getGlobalActivity : getMyActivity;
      const res = await fetcher({ page: 1, limit: 20, ...filters });

      setActivities(res.data?.activities || []);
      setHasMore(res.data?.pagination?.hasNextPage ?? false);
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load activity feed");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [feedType, JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load next page (append) ───────────────────────────────
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const fetcher = feedType === "global" ? getGlobalActivity : getMyActivity;
      const res = await fetcher({ page: nextPage, limit: 20, ...filters });

      setActivities((prev) => [...prev, ...(res.data?.activities || [])]);
      setHasMore(res.data?.pagination?.hasNextPage ?? false);
      setPage(nextPage);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load more activities");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [loading, hasMore, page, feedType, JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Prepend real-time activity at top of list ─────────────
  const prependActivity = useCallback((newActivity) => {
    setActivities((prev) => {
      // Deduplicate by ID (socket may fire more than once on rapid reconnects)
      if (prev.some((a) => a._id === newActivity.id || a._id === newActivity._id)) {
        return prev;
      }
      return [{ ...newActivity, _id: newActivity.id ?? newActivity._id }, ...prev].slice(
        0,
        200,
      ); // Cap in-memory list at 200 items
    });
  }, []);

  // ── Socket: listen for real-time newActivity events ───────
  useEffect(() => {
    const handleNewActivity = (e) => {
      prependActivity(e.detail);
    };

    window.addEventListener("socket:newActivity", handleNewActivity);
    return () => window.removeEventListener("socket:newActivity", handleNewActivity);
  }, [prependActivity]);

  // ── Initial fetch on mount / filter change ────────────────
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    hasMore,
    fetchActivities,
    loadMore,
    prependActivity,
  };
};

export default useActivity;
