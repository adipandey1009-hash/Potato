import { ApiResponse, ApiError } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiException extends Error {
  code: string;
  details?: Record<string, string>;
  status: number;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('potato_access_token');

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/api/v1/auth/')) {
    // Attempt token refresh
    const refreshToken = localStorage.getItem('potato_refresh_token');
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = (await refreshRes.json()) as ApiResponse<{
              accessToken: string;
              refreshToken: string;
            }>;
            localStorage.setItem('potato_access_token', data.data.accessToken);
            localStorage.setItem('potato_refresh_token', data.data.refreshToken);
            processQueue(null, data.data.accessToken);
            headers.set('Authorization', `Bearer ${data.data.accessToken}`);
            const retryRes = await fetch(url, { ...options, headers });
            const json = (await retryRes.json()) as ApiResponse<T>;
            return json.data;
          } else {
            throw new Error('Refresh token expired');
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem('potato_access_token');
          localStorage.removeItem('potato_refresh_token');
          localStorage.removeItem('potato_user');
          window.dispatchEvent(new Event('potato_auth_cleared'));
          throw new ApiException(401, {
            code: 'SESSION_EXPIRED',
            message: 'Your session has expired. Please log in again.',
          });
        } finally {
          isRefreshing = false;
        }
      } else {
        return new Promise<T>((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              headers.set('Authorization', `Bearer ${newToken}`);
              fetch(url, { ...options, headers })
                .then((res) => res.json())
                .then((json: ApiResponse<T>) => resolve(json.data))
                .catch(reject);
            },
            reject,
          });
        });
      }
    }
  }

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorDetail = data?.error || {
      code: 'HTTP_' + response.status,
      message: data?.message || response.statusText || 'Request failed',
    };
    throw new ApiException(response.status, errorDetail);
  }

  return data?.data !== undefined ? data.data : data;
}
