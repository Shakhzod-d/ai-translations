/**
 * Normalized error surfaced to the UI. `code` maps to a localized, user-friendly
 * message; raw backend/AI messages are kept only in `cause` for logging.
 */
export type ApiErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'SERVER'
  | 'INVALID_RESPONSE'
  | 'ABORTED'
  | 'AI_NOT_CONFIGURED'
  | 'AI_REFUSED'
  | 'AI_BUSY'
  | 'UNKNOWN';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;

  constructor(code: ApiErrorCode, options?: { status?: number; cause?: unknown }) {
    super(code, { cause: options?.cause });
    this.name = 'ApiError';
    this.code = code;
    this.status = options?.status;
  }

  get retryable() {
    return ['NETWORK', 'TIMEOUT', 'RATE_LIMITED', 'SERVER', 'AI_BUSY'].includes(this.code);
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const toApiError = (error: unknown): ApiError => {
  if (isApiError(error)) return error;
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError('ABORTED', { cause: error });
  }
  return new ApiError('UNKNOWN', { cause: error });
};

export const statusToCode = (status: number): ApiErrorCode => {
  if (status === 401 || status === 403) return 'UNAUTHORIZED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 408) return 'TIMEOUT';
  if (status === 422 || status === 400) return 'VALIDATION';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'SERVER';
  return 'UNKNOWN';
};
