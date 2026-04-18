/**
 * Calculates skip/limit values from raw query params.
 * - page  clamped to >= 1
 * - limit clamped to [1, 50]
 */
export const paginateQuery = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;
  return { pageNum, limitNum, skip };
};

/**
 * Builds the pagination meta object returned to the client.
 */
export const buildPaginationMeta = (total, pageNum, limitNum) => {
  const totalPages = Math.ceil(total / limitNum);
  return {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  };
};
