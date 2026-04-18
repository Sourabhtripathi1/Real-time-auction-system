import { useState } from 'react';
import SearchBar from './SearchBar';

// ── Icons ──────────────────────────────────────────────────
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Sort options ───────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'createdAt_desc',          label: 'Newest First' },
  { value: 'createdAt_asc',           label: 'Oldest First' },
  { value: 'basePrice_asc',           label: 'Price: Low to High' },
  { value: 'basePrice_desc',          label: 'Price: High to Low' },
  { value: 'endTime_asc',             label: 'Ending Soon' },
  { value: 'endTime_desc',            label: 'Ending Latest' },
  { value: 'currentHighestBid_desc',  label: 'Highest Bid' },
];

const inputCls = `w-full rounded-xl border border-gray-200 dark:border-gray-700
  px-3 py-2 text-sm text-gray-800 dark:text-white
  bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`;

const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

// ── FilterBar ──────────────────────────────────────────────
const FilterBar = ({
  filters       = {},
  onFilterChange = {},
  onReset,
  activeCount   = 0,
  role          = 'seller',
  isLoading     = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const {
    search = '', sortBy = 'createdAt', sortOrder = 'desc',
    startDate = '', endDate = '', minPrice = '', maxPrice = '',
    seller = '',
  } = filters;

  const {
    setSearch, setSort, setDateRange,
    setPriceRange, setSellerSearch,
  } = onFilterChange;

  // Current sort option value (combined field_order string)
  const currentSort = `${sortBy}_${sortOrder}`;

  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split('_');
    setSort?.(field, order);
  };

  const handleReset = () => {
    onReset?.();
    setExpanded(false);
  };

  return (
    <div className="space-y-2">
      {/* ── Row 1: Search + Sort + Filter toggle + Reset ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch?.('')}
          isLoading={isLoading}
          className="flex-1 min-w-[180px]"
        />

        {/* Sort dropdown */}
        <select
          value={currentSort}
          onChange={handleSortChange}
          disabled={isLoading}
          className={`rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm
            text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            disabled:opacity-50 transition shrink-0`}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Filter toggle button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium
              transition ${expanded
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <FilterIcon />
            Filters
          </button>
          {/* Active filter badge */}
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white
              text-xs font-bold flex items-center justify-center leading-none">
              {activeCount}
            </span>
          )}
        </div>

        {/* Clear all — only shown when filters are active */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700
              dark:hover:text-red-400 font-medium transition shrink-0"
          >
            <XIcon />
            Clear all
          </button>
        )}
      </div>

      {/* ── Row 2: Expandable Filter Panel ─────────────── */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 mt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Date range */}
            <div>
              <label className={labelCls}>From Date</label>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setDateRange?.(e.target.value, endDate)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>To Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setDateRange?.(startDate, e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Price range */}
            <div>
              <label className={labelCls}>Min Price (₹)</label>
              <input
                type="number"
                min={0}
                value={minPrice}
                placeholder="0"
                onChange={(e) => setPriceRange?.(e.target.value, maxPrice)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Max Price (₹)</label>
              <input
                type="number"
                min={0}
                value={maxPrice}
                placeholder="Any"
                onChange={(e) => setPriceRange?.(minPrice, e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Admin: seller name search */}
            {role === 'admin' && (
              <div className="md:col-span-2">
                <label className={labelCls}>Seller Name</label>
                <input
                  type="text"
                  value={seller}
                  placeholder="Search by seller name…"
                  onChange={(e) => setSellerSearch?.(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* Panel footer */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium transition"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700
                dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
