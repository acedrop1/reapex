/**
 * Centralized error handling utilities for the application
 * Handles API errors, Supabase errors, and provides user-friendly messages
 */

interface ErrorData {
  title?: string;
  message: string;
  severity?: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely constructs a URL from request.url
 * Prevents "Invalid URL" errors in API routes
 */
export function safeParseUrl(urlString: string): URL | null {
  try {
    // Handle relative URLs by adding a base URL
    if (urlString.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      return new URL(urlString, baseUrl);
    }
    return new URL(urlString);
  } catch (error) {
    console.error('[URL Parse Error]', error);
    return null;
  }
}

/**
 * Validates required environment variables
 */
export function validateEnvVars(): { valid: boolean; missing: string[] } {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missing: string[] = [];

  required.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Extracts error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;

  if (error instanceof Error) return error.message;

  if (error && typeof error === 'object') {
    // Supabase error format
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    // API error format
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }

    // Fetch response error
    if ('statusText' in error && typeof error.statusText === 'string') {
      return error.statusText;
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Converts error to user-friendly ErrorData format
 * Enhanced with browser-specific error detection
 */
export function parseError(error: unknown): ErrorData {
  const message = getErrorMessage(error);

  // Browser-Specific Error: CORS
  if (
    message.includes('CORS') ||
    message.includes('Cross-Origin') ||
    message.includes('No \'Access-Control-Allow-Origin\'')
  ) {
    return {
      title: 'Access Denied',
      message: 'This resource cannot be accessed due to security restrictions. Please contact support if this persists.',
      severity: 'error',
    };
  }

  // Browser-Specific Error: Storage Quota
  if (
    message.includes('QuotaExceededError') ||
    message.includes('storage quota') ||
    message.includes('exceeded the quota')
  ) {
    return {
      title: 'Storage Full',
      message: 'Your browser storage is full. Please clear some data and try again.',
      severity: 'warning',
      action: {
        label: 'Clear Cache',
        onClick: () => {
          // Clear localStorage and sessionStorage
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
        },
      },
    };
  }

  // Browser-Specific Error: CSP Violation
  if (
    message.includes('Content Security Policy') ||
    message.includes('CSP') ||
    message.includes('blocked by CSP')
  ) {
    return {
      title: 'Security Policy Violation',
      message: 'A security policy prevented this action. Please refresh and try again.',
      severity: 'error',
      action: {
        label: 'Refresh Page',
        onClick: () => window.location.reload(),
      },
    };
  }

  // Authentication errors
  if (message.includes('Unauthorized') || message.includes('401')) {
    return {
      title: 'Authentication Required',
      message: 'Please log in to continue',
      severity: 'warning',
      action: {
        label: 'Go to Login',
        href: '/login',
      },
    };
  }

  // Not found errors
  if (message.includes('404') || message.includes('not found')) {
    return {
      title: 'Not Found',
      message: 'The requested resource could not be found',
      severity: 'warning',
    };
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError')
  ) {
    return {
      title: 'Network Error',
      message: 'Please check your internet connection and try again',
      severity: 'error',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    };
  }

  // URL errors
  if (message.includes('Invalid URL') || message.includes('URL')) {
    return {
      title: 'Configuration Error',
      message: 'There was a problem with the request. Please try refreshing the page.',
      severity: 'error',
      action: {
        label: 'Refresh Page',
        onClick: () => window.location.reload(),
      },
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long. Please try again.',
      severity: 'warning',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    };
  }

  // Default error
  return {
    title: 'Error',
    message,
    severity: 'error',
  };
}

/**
 * Handles API fetch errors and throws user-friendly errors
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: response.statusText || 'Request failed',
    }));

    throw parseError(errorData.error || errorData.message || response.statusText);
  }

  return response.json();
}

/**
 * Wrapper for fetch calls with automatic error handling
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    return await handleApiResponse<T>(response);
  } catch (error) {
    throw parseError(error);
  }
}

/**
 * React Query error handler
 * Use in onError callbacks for useQuery/useMutation
 */
export function createQueryErrorHandler(
  showError: (error: ErrorData) => void
) {
  return (error: unknown) => {
    const errorData = parseError(error);
    showError(errorData);
  };
}

/**
 * API route error response helper
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage = 'An error occurred'
): Response {
  const message = getErrorMessage(error);
  const statusCode = message.includes('Unauthorized') ? 401 :
                    message.includes('not found') ? 404 : 500;

  return Response.json(
    { error: message || defaultMessage },
    { status: statusCode }
  );
}

/**
 * Validates Supabase client configuration
 */
export function validateSupabaseConfig(): void {
  const { valid, missing } = validateEnvVars();

  if (!valid) {
    throw new Error(
      `Missing Supabase environment variables: ${missing.join(', ')}`
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!isValidUrl(url)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: ${url}. Must be a valid URL.`
    );
  }
}
