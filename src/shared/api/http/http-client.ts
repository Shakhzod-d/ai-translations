import type { z } from 'zod';
import { ApiError, statusToCode, toApiError } from '../errors';

export interface RequestOptions<S extends z.ZodType> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  schema: S;
  signal?: AbortSignal;
}

/**
 * The single place that talks to `fetch`. Responses are always validated;
 * a contract mismatch is reported as INVALID_RESPONSE instead of leaking `unknown` data.
 */
export const createHttpClient = (baseUrl: string) => {
  const request = async <S extends z.ZodType>(
    path: string,
    { method = 'GET', body, schema, signal }: RequestOptions<S>,
  ): Promise<z.infer<S>> => {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        signal,
        credentials: 'include',
        headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
        body:
          body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      });
    } catch (error) {
      const normalized = toApiError(error);
      throw normalized.code === 'UNKNOWN' ? new ApiError('NETWORK', { cause: error }) : normalized;
    }

    if (!response.ok) {
      throw new ApiError(statusToCode(response.status), {
        status: response.status,
        cause: await response.text().catch(() => undefined),
      });
    }

    const json: unknown = response.status === 204 ? null : await response.json();
    const result = schema.safeParse(json);
    if (!result.success) throw new ApiError('INVALID_RESPONSE', { cause: result.error });
    return result.data;
  };

  /** Multipart upload with progress — fetch has no upload progress, so XHR is used here only. */
  const upload = <S extends z.ZodType>(
    path: string,
    form: FormData,
    {
      schema,
      signal,
      onProgress,
    }: { schema: S; signal?: AbortSignal; onProgress?: (ratio: number) => void },
  ) =>
    new Promise<z.infer<S>>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${baseUrl}${path}`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(event.loaded / event.total);
      };
      xhr.onerror = () => reject(new ApiError('NETWORK'));
      xhr.onabort = () => reject(new ApiError('ABORTED'));
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new ApiError(statusToCode(xhr.status), { status: xhr.status }));
          return;
        }
        try {
          const result = schema.safeParse(JSON.parse(xhr.responseText));
          if (result.success) resolve(result.data);
          else reject(new ApiError('INVALID_RESPONSE', { cause: result.error }));
        } catch (error) {
          reject(new ApiError('INVALID_RESPONSE', { cause: error }));
        }
      };
      signal?.addEventListener('abort', () => xhr.abort(), { once: true });
      xhr.send(form);
    });

  return { request, upload };
};

export type HttpClient = ReturnType<typeof createHttpClient>;
