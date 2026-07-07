export interface PagiNationData {
  per_page: number;
  page: number;
}

export interface PaginationMeta {
  per_page: number;
  hasMore: boolean;
  currPage: number;
  prevPage: number | null;
  nextPage: number | null;
}

export type PaginatedResult<TData, TKey extends string = 'data'> = {
  pagination: PaginationMeta;
} & Record<TKey, TData>;
