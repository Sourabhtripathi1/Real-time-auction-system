// ── Pagination ─────────────────────────────────────────────
// Accepts pagination meta from API and calls onPageChange / onLimitChange.

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Build the list of page numbers (with ellipsis markers) to render
const buildPageList = (current, total) => {
  if (total <= 1) return [1];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current]);
  if (current > 1) pages.add(current - 1);
  if (current < total) pages.add(current + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push('...');
    }
    result.push(sorted[i]);
  }

  return result;
};

const Pagination = ({
  pagination   = {},
  onPageChange,
  onLimitChange,
  isLoading    = false,
}) => {
  const {
    total      = 0,
    page       = 1,
    limit      = 10,
    totalPages = 0,
    hasNextPage = false,
    hasPrevPage = false,
  } = pagination;

  // Don't render anything if there's only 1 page and no results
  if (total === 0 && !isLoading) return null;
  if (totalPages <= 1 && total <= limit && !isLoading) return null;

  const from  = total === 0 ? 0 : (page - 1) * limit + 1;
  const to    = Math.min(page * limit, total);
  const pages = buildPageList(page, totalPages);

  const btnBase = `inline-flex items-center justify-center h-9 rounded-lg text-sm font-medium
    transition disabled:opacity-40 disabled:cursor-not-allowed`;
  const btnInactive = `${btnBase} w-9 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300
    border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700`;
  const btnActive = `${btnBase} w-9 bg-indigo-600 text-white font-semibold shadow-sm`;
  const btnNav = `${btnBase} px-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300
    border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700`;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">

      {/* Left — Results info */}
      <div className="text-sm text-gray-500 dark:text-gray-400 shrink-0 order-2 sm:order-1">
        {total === 0
          ? 'No results found'
          : `Showing ${from}–${to} of ${total.toLocaleString()} result${total !== 1 ? 's' : ''}`
        }
      </div>

      {/* Center — Page buttons (hidden on mobile) */}
      <div className="hidden sm:flex items-center gap-1 order-1 sm:order-2">
        {/* Prev */}
        <button
          onClick={() => onPageChange?.(page - 1)}
          disabled={!hasPrevPage || isLoading}
          className={btnNav}
          aria-label="Previous page"
        >
          ←
        </button>

        {pages.map((p, i) =>
          p === '...'
            ? (
              <span key={`ellipsis-${i}`} className="text-gray-400 dark:text-gray-500 w-9 text-center select-none">
                …
              </span>
            )
            : (
              <button
                key={p}
                onClick={() => onPageChange?.(p)}
                disabled={isLoading}
                className={p === page ? btnActive : btnInactive}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange?.(page + 1)}
          disabled={!hasNextPage || isLoading}
          className={btnNav}
          aria-label="Next page"
        >
          →
        </button>
      </div>

      {/* Mobile — compact page indicator */}
      <div className="flex sm:hidden items-center gap-2 order-1">
        <button
          onClick={() => onPageChange?.(page - 1)}
          disabled={!hasPrevPage || isLoading}
          className={btnNav}
          aria-label="Previous page"
        >
          ←
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange?.(page + 1)}
          disabled={!hasNextPage || isLoading}
          className={btnNav}
          aria-label="Next page"
        >
          →
        </button>
      </div>

      {/* Right — Per-page selector */}
      <div className="flex items-center gap-2 shrink-0 order-3 text-sm text-gray-500 dark:text-gray-400">
        <span className="hidden sm:inline">Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange?.(Number(e.target.value))}
          disabled={isLoading}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-sm
            bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
            focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;
