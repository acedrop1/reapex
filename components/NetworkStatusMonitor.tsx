'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Component that monitors network status
 * Automatically shows notifications when user goes offline/online
 */
export function NetworkStatusMonitor() {
  useNetworkStatus();
  return null; // This component doesn't render anything
}
