'use client';

import { useEffect } from 'react';
import { useError } from '@/contexts/ErrorContext';
import { parseError } from '@/lib/utils/errorHandler';

/**
 * Global error handler component that catches:
 * - Unhandled promise rejections
 * - Global JavaScript errors
 * - Browser-specific errors
 *
 * Integrates with ErrorContext to display errors in modal
 */
export function GlobalErrorHandler() {
  const { showError } = useError();

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault(); // Prevent browser default error handling

      const error = parseError(event.reason);
      showError({
        ...error,
        title: error.title || 'Unhandled Error',
      });
    };

    // Handle global JavaScript errors
    const handleGlobalError = (event: ErrorEvent) => {
      event.preventDefault(); // Prevent browser default error handling

      const error = parseError(event.error || event.message);
      showError({
        ...error,
        title: error.title || 'Application Error',
      });
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [showError]);

  return null; // This component doesn't render anything
}
