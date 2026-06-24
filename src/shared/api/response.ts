export interface MetaEnvelope {
  requestId: string;
  timestamp: string;
}

export interface PaginationEnvelope {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SuccessResponse<T> {
  data: T;
  meta: MetaEnvelope;
}

export interface ListResponse<T> {
  data: T[];
  pagination: PaginationEnvelope;
  meta: MetaEnvelope;
}

export function formatResponse<T>(data: T, requestId: string): SuccessResponse<T> {
  return {
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function formatListResponse<T>(
  data: T[],
  pagination: { page: number; pageSize: number; total: number },
  requestId: string
): ListResponse<T> {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  return {
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages: isNaN(totalPages) ? 0 : totalPages,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}
