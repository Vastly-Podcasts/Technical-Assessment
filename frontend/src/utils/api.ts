/**
 * api.ts
 *
 * Centralized API client with timeout, retry, and error handling.
 * Provides type-safe API calls with proper error handling.
 *
 * ============================================================================
 * FEATURES
 * ============================================================================
 *
 * - Request timeout (prevents hanging requests)
 * - Automatic retry with exponential backoff
 * - Request cancellation support (AbortController)
 * - Proper error handling and typing
 * - Network error detection
 */

import { getApiEndpoint, REQUEST_TIMEOUT, MAX_RETRIES, RETRY_DELAY_BASE } from './config';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Check if error is a network error (no response from server)
 */
const isNetworkError = (error: unknown): boolean => {
  return (
    error instanceof TypeError &&
    (error.message.includes('fetch') || error.message.includes('network'))
  );
};

/**
 * Check if error is a timeout error
 */
const isTimeoutError = (error: unknown): boolean => {
  return error instanceof Error && error.name === 'AbortError';
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number): number => {
  return RETRY_DELAY_BASE * Math.pow(2, attempt);
};

/**
 * API request options
 */
export interface ApiRequestOptions {
  /** Request timeout in milliseconds (default: REQUEST_TIMEOUT) */
  timeout?: number;
  /** Maximum retry attempts (default: MAX_RETRIES) */
  maxRetries?: number;
  /** AbortController for request cancellation */
  signal?: AbortSignal;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: BodyInit;
  /** Request method (default: GET) */
  method?: string;
}

/**
 * Make an API request with timeout, retry, and error handling
 *
 * @param endpoint - API endpoint path (e.g., '/api/health')
 * @param options - Request options
 * @returns Promise resolving to Response
 * @throws ApiError on failure
 *
 * @example
 * ```ts
 * try {
 *   const response = await apiRequest('/api/health');
 *   const data = await response.json();
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error('API error:', error.status, error.message);
 *   }
 * }
 * ```
 */
export async function apiRequest(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const {
    timeout = REQUEST_TIMEOUT,
    maxRetries = MAX_RETRIES,
    signal: externalSignal,
    headers = {},
    body,
    method = 'GET',
  } = options;

  // Create AbortController for timeout
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, timeout);

  // Combine external signal with timeout signal
  const combinedSignal = externalSignal
    ? (() => {
        const combined = new AbortController();
        externalSignal.addEventListener('abort', () => combined.abort());
        timeoutController.signal.addEventListener('abort', () => combined.abort());
        return combined.signal;
      })()
    : timeoutController.signal;

  let lastError: unknown;

  // Retry loop
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if request was cancelled
      if (combinedSignal.aborted) {
        throw new ApiError('Request cancelled', 0, 'Cancelled');
      }

      const url = getApiEndpoint(endpoint);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body,
        signal: combinedSignal,
      });

      // Clear timeout on success
      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new ApiError(
          `API request failed: ${errorText}`,
          response.status,
          response.statusText,
          response
        );
      }

      return response;
    } catch (error) {
      lastError = error;

      // Don't retry on cancellation or client errors (4xx)
      if (
        isTimeoutError(error) ||
        (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500)
      ) {
        clearTimeout(timeoutId);
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        clearTimeout(timeoutId);
        break;
      }

      // Calculate delay with exponential backoff
      const delay = getRetryDelay(attempt);
      await sleep(delay);
    }
  }

  // All retries exhausted
  clearTimeout(timeoutId);

  if (isNetworkError(lastError)) {
    throw new ApiError(
      'Network error: Unable to reach server. Please check your connection.',
      0,
      'Network Error'
    );
  }

  // Note: Timeout errors are thrown immediately in the retry loop (line 183),
  // so they never reach this point. The timeout error handling is complete
  // at that point, so no additional check is needed here.

  if (lastError instanceof ApiError) {
    throw lastError;
  }

  throw new ApiError(
    `Request failed after ${maxRetries + 1} attempts: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`,
    0,
    'Request Failed'
  );
}

/**
 * Make a GET request and parse JSON response
 *
 * @param endpoint - API endpoint path
 * @param options - Request options
 * @returns Promise resolving to parsed JSON data
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<T> {
  const response = await apiRequest(endpoint, { ...options, method: 'GET' });
  return response.json();
}

/**
 * Make a POST request and parse JSON response
 *
 * @param endpoint - API endpoint path
 * @param options - Request options (body will be JSON stringified)
 * @returns Promise resolving to parsed JSON data
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, 'method'> & { body?: unknown }
): Promise<T> {
  const { body, ...restOptions } = options || {};
  const response = await apiRequest(endpoint, {
    ...restOptions,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}
