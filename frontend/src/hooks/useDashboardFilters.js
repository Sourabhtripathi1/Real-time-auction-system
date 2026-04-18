import { useState, useCallback, useMemo } from 'react';

const DEFAULTS = {
  search:    '',
  status:    'all',
  sortBy:    'createdAt',
  sortOrder: 'desc',
  page:      1,
  limit:     10,
  startDate: '',
  endDate:   '',
  minPrice:  '',
  maxPrice:  '',
  seller:    '', // admin-only seller name search
};

const useDashboardFilters = (overrides = {}) => {
  const [filters, setFilters] = useState({ ...DEFAULTS, ...overrides });

  // ── Setters ────────────────────────────────────────────
  const setSearch = useCallback((value) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  }, []);

  const setStatus = useCallback((value) => {
    setFilters((prev) => ({ ...prev, status: value, page: 1 }));
  }, []);

  const setSort = useCallback((field, order) => {
    setFilters((prev) => ({ ...prev, sortBy: field, sortOrder: order, page: 1 }));
  }, []);

  const setPage = useCallback((num) => {
    setFilters((prev) => ({ ...prev, page: num }));
  }, []);

  const setLimit = useCallback((num) => {
    setFilters((prev) => ({ ...prev, limit: Number(num), page: 1 }));
  }, []);

  const setDateRange = useCallback((start, end) => {
    setFilters((prev) => ({ ...prev, startDate: start, endDate: end, page: 1 }));
  }, []);

  const setPriceRange = useCallback((min, max) => {
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max, page: 1 }));
  }, []);

  const setSellerSearch = useCallback((value) => {
    setFilters((prev) => ({ ...prev, seller: value, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULTS, ...overrides });
  }, [overrides]);

  // ── Build query string from current state ──────────────
  const buildQueryString = useCallback((state = filters) => {
    const params = new URLSearchParams();

    // Always include page and limit
    params.set('page',  String(state.page));
    params.set('limit', String(state.limit));

    if (state.search)                              params.set('search',    state.search);
    if (state.status && state.status !== 'all')    params.set('status',    state.status);
    if (state.sortBy !== DEFAULTS.sortBy)          params.set('sortBy',    state.sortBy);
    if (state.sortOrder !== DEFAULTS.sortOrder)    params.set('sortOrder', state.sortOrder);
    if (state.startDate)                           params.set('startDate', state.startDate);
    if (state.endDate)                             params.set('endDate',   state.endDate);
    if (state.minPrice !== '')                     params.set('minPrice',  state.minPrice);
    if (state.maxPrice !== '')                     params.set('maxPrice',  state.maxPrice);
    if (state.seller)                              params.set('seller',    state.seller);

    return `?${params.toString()}`;
  }, [filters]);

  // ── Number of non-default active filters ───────────────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search)                            count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.sortBy !== DEFAULTS.sortBy || filters.sortOrder !== DEFAULTS.sortOrder) count++;
    if (filters.startDate || filters.endDate)      count++;
    if (filters.minPrice !== '' || filters.maxPrice !== '') count++;
    if (filters.seller)                            count++;
    return count;
  }, [filters]);

  return {
    filters,
    // Setters
    setSearch,
    setStatus,
    setSort,
    setPage,
    setLimit,
    setDateRange,
    setPriceRange,
    setSellerSearch,
    resetFilters,
    // Computed
    buildQueryString,
    activeFilterCount,
  };
};

export default useDashboardFilters;
