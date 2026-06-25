export interface ApiResponseEnvelope<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiPaginatedResponseEnvelope<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
