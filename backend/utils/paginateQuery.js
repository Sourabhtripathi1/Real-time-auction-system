/**
 * paginateQuery
 *
 * Parses and validates pagination params from the request query string.
 * Hard caps: page >= 1, 1 <= limit <= 50 (never trust the client's limit value).
 *
 * Accepts either (queryObject) or (page, limit) for backward compat.
 *
 * @param {object|string} pageOrQuery - req.query object OR page string
 * @param {string} [limit]            - limit string (when called as paginateQuery(page, limit))
 * @returns {{ pageNum, limitNum, skip }}
 */
export const paginateQuery = (pageOrQuery, limit) => {
  let rawPage, rawLimit;

  if (typeof pageOrQuery === "object" && pageOrQuery !== null) {
    // Called as paginateQuery(req.query)
    rawPage = pageOrQuery.page;
    rawLimit = pageOrQuery.limit;
  } else {
    // Called as paginateQuery(page, limit)  — legacy signature
    rawPage = pageOrQuery;
    rawLimit = limit;
  }

  const pageNum = Math.max(1, parseInt(rawPage) || 1);
  // Hard cap: never allow client to request more than 50 records at once.
  // This prevents accidental or malicious full-collection dumps.
  const limitNum = Math.min(50, Math.max(1, parseInt(rawLimit) || 10));
  const skip = (pageNum - 1) * limitNum;

  return { pageNum, limitNum, skip };
};

/**
 * buildPaginationMeta
 *
 * Builds the pagination metadata object returned to the client.
 * Adds from/to range info so the UI can display "Showing 1-10 of 243".
 *
 * @param {number} total    - total number of matching documents
 * @param {number} pageNum  - current page number
 * @param {number} limitNum - page size
 */
export const buildPaginationMeta = (total, pageNum, limitNum) => {
  const totalPages = Math.ceil(total / limitNum) || 1;
  return {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    // Range info: "Showing 11-20 of 243"
    from: total === 0 ? 0 : (pageNum - 1) * limitNum + 1,
    to: Math.min(pageNum * limitNum, total),
  };
};
