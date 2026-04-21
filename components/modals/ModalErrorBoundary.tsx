'use client';

import { Component, ReactNode } from 'react';
import { useError } from '@/contexts/ErrorContext';
import { parseError } from '@/lib/utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary specifically for modal components
 * Catches errors within modals and displays them via ErrorContext
 * Prevents modal errors from crashing the entire application
 */
class ModalErrorBoundaryClass extends Component<Props & { showError: (error: any) => void }, State> {
  constructor(props: Props & { showError: (error: any) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('[ModalErrorBoundary] Error caught:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Display error via ErrorContext
    const parsedError = parseError(error);
    this.props.showError({
      ...parsedError,
      title: parsedError.title || 'Modal Error',
    });
  }

  render() {
    if (this.state.hasError) {
      // Return fallback UI or null
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

/**
 * Wrapper component that provides ErrorContext to the error boundary
 */
export function ModalErrorBoundary({ children, fallback, onError }: Props) {
  const { showError } = useError();

  return (
    <ModalErrorBoundaryClass showError={showError} fallback={fallback} onError={onError}>
      {children}
    </ModalErrorBoundaryClass>
  );
}
