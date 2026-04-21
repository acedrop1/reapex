/**
 * Error Handling Utilities
 * Centralized error handling for the application
 */

import { ZodError } from 'zod';

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }

  static fromZodError(error: ZodError): ValidationError {
    const details = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return new ValidationError('Validation failed', details);
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends AppError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Database Error
 */
export class DatabaseError extends AppError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, originalError?: any) {
    super(message, 500, 'DATABASE_ERROR', {
      originalError: originalError?.message,
    });
  }
}

/**
 * External Service Error
 */
export class ExternalServiceError extends AppError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(service: string, message: string, originalError?: any) {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', {
      service,
      originalError: originalError?.message,
    });
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests', 429, 'RATE_LIMIT_ERROR', {
      retryAfter,
    });
  }
}

/**
 * Error Handler for API Routes
 */
export function handleApiError(error: unknown): {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
} {
  console.error('API Error:', error);

  // Known AppError instances
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
    };
  }

  // Zod Validation Errors
  if (error instanceof ZodError) {
    const validationError = ValidationError.fromZodError(error);
    return {
      status: validationError.statusCode,
      body: {
        error: {
          message: validationError.message,
          code: validationError.code,
          details: validationError.details,
        },
      },
    };
  }

  // Supabase Errors
  if (error && typeof error === 'object' && 'code' in error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseError = error as any;

    // Map common Supabase error codes
    switch (supabaseError.code) {
      case '23505': // Unique violation
        return {
          status: 409,
          body: {
            error: {
              message: 'Resource already exists',
              code: 'DUPLICATE_ERROR',
              details: supabaseError.message,
            },
          },
        };

      case '23503': // Foreign key violation
        return {
          status: 400,
          body: {
            error: {
              message: 'Invalid reference',
              code: 'FOREIGN_KEY_ERROR',
              details: supabaseError.message,
            },
          },
        };

      case 'PGRST116': // Not found
        return {
          status: 404,
          body: {
            error: {
              message: 'Resource not found',
              code: 'NOT_FOUND',
            },
          },
        };

      case '42501': // Insufficient privilege (RLS)
        return {
          status: 403,
          body: {
            error: {
              message: 'Access denied',
              code: 'AUTHORIZATION_ERROR',
            },
          },
        };
    }
  }

  // Generic Error
  if (error instanceof Error) {
    return {
      status: 500,
      body: {
        error: {
          message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
          code: 'INTERNAL_ERROR',
        },
      },
    };
  }

  // Unknown Error
  return {
    status: 500,
    body: {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
    },
  };
}

/**
 * Async error wrapper for route handlers
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asyncHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const { status, body } = handleApiError(error);
      return Response.json(body, { status });
    }
  }) as T;
}

/**
 * Safe async execution with error handling
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<[T | null, Error | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(errorMessage || 'Operation failed');
    return [null, err];
  }
}

/**
 * Assert condition or throw error
 */
export function assert(
  condition: boolean,
  message: string,
  ErrorClass: typeof AppError = AppError
): asserts condition {
  if (!condition) {
    throw new ErrorClass(message);
  }
}

/**
 * Type guard for checking if value is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Log error with context
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };

  console.error('Error:', JSON.stringify(errorInfo, null, 2));

  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: context });
  }
}
