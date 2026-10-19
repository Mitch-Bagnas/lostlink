import { ApiErrorResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  data: ApiErrorResponse;

  constructor(status: number, data: ApiErrorResponse) {
    super(data.message || data.error || `HTTP error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuthRedirect = false, headers, ...customConfig } = options;

  // Clean trailing and leading slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL.replace(/\/$/, '')}${cleanEndpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    method: 'GET',
    credentials: 'include', // sends httpOnly auth cookie across requests
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  };

  try {
    const response = await fetch(url, config);

    // If 401 Unauthorized, automatically clear stale state and redirect to /auth
    if (response.status === 401 && !skipAuthRedirect) {
      const currentPath = window.location.pathname;
      const isPublicRoute =
        currentPath === '/' ||
        currentPath === '/auth' ||
        currentPath.startsWith('/found');

      if (!isPublicRoute) {
        window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    // Try parsing JSON response
    let responseData: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = text ? { message: text } : {};
    }

    if (!response.ok) {
      throw new ApiError(response.status, responseData || { error: response.statusText });
    }

    return responseData as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors or failed fetches
    console.error('API Client Network Error:', error);
    throw new ApiError(0, {
      error: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
    });
  }
}
