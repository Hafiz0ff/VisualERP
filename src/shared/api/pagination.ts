export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  total: number;
  data: T[];
}

export function getPagination(query: Pick<PaginationQuery, 'page' | 'pageSize'>): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const page = query.page || DEFAULT_PAGE;
  const pageSize = query.pageSize || DEFAULT_PAGE_SIZE;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}
