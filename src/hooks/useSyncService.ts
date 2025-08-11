'use client';

import { useEffect, useState } from 'react';
import { SyncStatus } from '@/lib/inwentura/syncService';

// Lazy import to avoid SSR issues
const getSyncService = async () => {
  const { getSyncService: getSyncServiceImpl } = await import('@/lib/inwentura/syncService');
  return getSyncServiceImpl();
};

export function useSyncService() {
  const [syncService, setSyncService] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : false,
    isSyncing: false,
    lastSync: null,
    pendingItems: 0,
    errors: []
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initSyncService = async () => {
      try {
        const service = await getSyncService();
        setSyncService(service);
        
        // Set up status listener
        service.onStatusChange(setSyncStatus);
        
        return () => {
          service.removeStatusListener(setSyncStatus);
        };
      } catch (error) {
        console.error('Failed to initialize sync service:', error);
      }
    };

    initSyncService();
  }, []);

  return {
    syncService,
    syncStatus,
    isReady: syncService !== null
  };
}
