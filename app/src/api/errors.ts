import { toast } from 'sonner';

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: unknown[];

  constructor(message: string, code: string, status: number, details?: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function formatValidationDetails(details?: unknown[]): string {
  return (details || [])
    .map((detail) => {
      if (!detail || typeof detail !== 'object') {
        return '';
      }
      const entries = Object.entries(detail as Record<string, unknown>);
      const [field, message] = entries[0] || [];
      return field ? `${field}: ${String(message)}` : '';
    })
    .filter(Boolean)
    .join(', ');
}

export function handleApiError(error: unknown) {
  console.error('API Error intercepted:', error);
  if (error instanceof ApiError) {
    if (error.status === 400 && error.code === 'VALIDATION_ERROR') {
      const fieldErrors = formatValidationDetails(error.details);
      toast.error(`Ошибка валидации: ${error.message} ${fieldErrors ? `(${fieldErrors})` : ''}`);
    } else if (error.status === 403) {
      toast.error(`Доступ запрещен: ${error.message}`);
    } else if (error.status === 404) {
      toast.error(`Не найдено: ${error.message}`);
    } else if (error.status === 409) {
      toast.error(`Конфликт: ${error.message}`);
    } else {
      toast.error(`Ошибка (${error.code}): ${error.message}`);
    }
  } else if (error instanceof DOMException && error.name === 'AbortError') {
    // Network query was intentionally aborted, silence.
    console.warn('API request aborted');
  } else if (error instanceof Error) {
    toast.error(error.message || 'Произошла неизвестная ошибка при подключении к серверу');
  } else {
    toast.error('Произошла неизвестная ошибка при подключении к серверу');
  }
}
