import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../api/client';
import { handleApiError } from '../api/errors';

export interface UseApiQueryOptions {
  params?: Record<string, string | number | boolean | null | undefined>;
  enabled?: boolean;
  skipGlobalErrorHandler?: boolean;
}

export function useApiQuery<T>(path: string, options?: UseApiQueryOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(options?.enabled !== false);
  const [error, setError] = useState<Error | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiRequest<T>('GET', path, {
          params: optionsRef.current?.params,
          signal,
        });
        setData(response);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err : new Error('Unknown API request error'));
        if (!optionsRef.current?.skipGlobalErrorHandler) {
          handleApiError(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [path]
  );

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (options?.enabled === false) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    fetchData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [path, JSON.stringify(options?.params), options?.enabled, fetchData]);

  useEffect(() => {
    const handleOrgChange = () => {
      fetchData();
    };

    window.addEventListener('organization-changed', handleOrgChange);
    return () => {
      window.removeEventListener('organization-changed', handleOrgChange);
    };
  }, [fetchData]);

  return { data, loading, error, refetch };
}
