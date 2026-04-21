'use client';

import { useEffect, useState } from 'react';
import { useError } from '@/contexts/ErrorContext';

/**
 * Custom hook for detecting network status changes
 * Shows warning modal when user goes offline
 * Shows success modal when user comes back online
 */
export function useNetworkStatus() {
  const { showError } = useError();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialize with current status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      showError({
        title: 'Connection Restored',
        message: 'You are back online. All features are now available.',
        severity: 'success',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      showError({
        title: 'No Internet Connection',
        message: 'You are currently offline. Some features may not work until your connection is restored.',
        severity: 'warning',
        action: {
          label: 'Retry',
          onClick: () => {
            // Try to reload the page
            if (navigator.onLine) {
              window.location.reload();
            }
          },
        },
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showError]);

  return { isOnline };
}
