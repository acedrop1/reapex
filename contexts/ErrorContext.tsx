'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ErrorModal } from '@/components/ErrorModal';

interface ErrorData {
  title?: string;
  message: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface ErrorContextType {
  showError: (error: ErrorData) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<ErrorData | null>(null);
  const [open, setOpen] = useState(false);

  const showError = (errorData: ErrorData) => {
    setError(errorData);
    setOpen(true);
  };

  const clearError = () => {
    setOpen(false);
    setTimeout(() => setError(null), 300); // Wait for animation
  };

  return (
    <ErrorContext.Provider value={{ showError, clearError }}>
      {children}
      <ErrorModal open={open} onClose={clearError} error={error} />
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
