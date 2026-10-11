/**
 * Central HTTP client for interacting with the Spring Boot backend API.
 * Uses browser fetch with credentials: 'include' to handle session cookies (JSESSIONID).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, errors = null, raw = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.raw = raw;
  }
}

export async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const defaultHeaders = {
    'Accept': 'application/json',
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const config = {
    credentials: 'include',
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred';
      let errorList = null;

      if (data) {
        if (data.message) {
          errorMessage = data.message;
        }
        if (data.errors && Array.isArray(data.errors)) {
          errorList = data.errors;
          errorMessage = data.errors.map(e => e.message || e).join(', ');
        }
      }

      throw new ApiError(errorMessage, response.status, errorList, data);
    }

    // Spring Boot returns standard ApiResponse<T>: { success, message, data, errors, timestamp }
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        throw new ApiError(data.message || 'Operation failed', response.status, data.errors, data);
      }
      return data.data !== undefined ? data.data : data;
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network request failed', 0, null, null);
  }
}

export const http = {
  get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options = {}) => request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options = {}) => request(endpoint, { method: 'PUT', body, ...options }),
  patch: (endpoint, body, options = {}) => request(endpoint, { method: 'PATCH', body, ...options }),
  delete: (endpoint, options = {}) => request(endpoint, { method: 'DELETE', ...options }),
};

export default http;
