import { PaginationMeta } from '../types/pagination';

export function buildPagenationMeta(
  resource: any[],
  page: number,
  per_page: number
): PaginationMeta {
  return {
    hasMore: resource.length > per_page,
    per_page,
    currPage: page,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: resource.length > per_page ? page + 1 : null,
  };
}
