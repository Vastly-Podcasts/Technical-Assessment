/**
 * config.ts
 *
 * Centralized configuration management with environment variable support.
 * Provides type-safe access to API endpoints and other configuration.
 *
 * ============================================================================
 * ENVIRONMENT VARIABLES
 * ============================================================================
 *
 * For development (default):
 * - REACT_APP_API_URL=http://localhost:8080
 *
 * For production:
 * - REACT_APP_API_URL=https://api.example.com
 *
 * React requires REACT_APP_ prefix for environment variables to be exposed.
 * These are replaced at build time, not runtime.
 */

/**
 * Get API base URL from environment variable or fallback to localhost.
 * 
 * In production, set REACT_APP_API_URL environment variable.
 * In development, defaults to localhost:8080.
 */
export const getApiUrl = (): string => {
  // React environment variables are available at build time
  const envUrl = process.env.REACT_APP_API_URL;
  
  if (envUrl) {
    // Remove trailing slash if present
    return envUrl.replace(/\/$/, '');
  }
  
  // Fallback to localhost for development
  // In production, this should be set via environment variable
  return 'http://localhost:8080';
};

/**
 * API endpoint paths (relative to base URL)
 */
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  FILTERS: '/api/filters',
  FILTER: (id: string) => `/api/filters/${id}`,
  UPLOAD: '/api/upload',
  PROCESS: '/api/process',
  JOB_STATUS: (jobId: string) => `/api/video/jobs/${jobId}`,
} as const;

/**
 * Get full API URL for an endpoint
 */
export const getApiEndpoint = (endpoint: string): string => {
  const baseUrl = getApiUrl();
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

/**
 * Request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Health check interval in milliseconds
 */
export const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds (reduced from 10s)

/**
 * Maximum retry attempts for failed requests
 */
export const MAX_RETRIES = 3;

/**
 * Retry delay in milliseconds (exponential backoff base)
 */
export const RETRY_DELAY_BASE = 1000; // 1 second
