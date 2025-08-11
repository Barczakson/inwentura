import { InventoryItem, Product } from '@/types/inwentura';
import { offlineStorage, SyncQueueItem } from './offlineStorage';
import { apiService } from './api';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingItems: number;
  errors: string[];
}

class SyncService {
  private isOnline = typeof window !== 'undefined' ? navigator.onLine : false;
  private isSyncing = false;
  private lastSync: Date | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private statusCallbacks: ((status: SyncStatus) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.startPeriodicSync();
    }
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('App is online - starting sync');
      this.syncNow();
      this.notifyStatusChange();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App is offline');
      this.notifyStatusChange();
    });

    // Sync when page becomes visible
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.isOnline) {
          this.syncNow();
        }
      });
    }
  }

  private startPeriodicSync() {
    if (typeof window === 'undefined') return;

    // Sync every 2 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncNow();
      }
    }, 2 * 60 * 1000);
  }

  public onStatusChange(callback: (status: SyncStatus) => void) {
    this.statusCallbacks.push(callback);
    // Immediately call with current status
    this.getStatus().then(callback);
  }

  public removeStatusListener(callback: (status: SyncStatus) => void) {
    const index = this.statusCallbacks.indexOf(callback);
    if (index > -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }

  private async notifyStatusChange() {
    const status = await this.getStatus();
    this.statusCallbacks.forEach(callback => callback(status));
  }

  public async getStatus(): Promise<SyncStatus> {
    const stats = await offlineStorage.getStorageStats();
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSync: this.lastSync,
      pendingItems: stats.syncQueueCount,
      errors: []
    };
  }

  // Add item to local storage and sync queue
  public async addInventoryItem(item: InventoryItem, userId: string): Promise<void> {
    try {
      // Save to local storage immediately
      await offlineStorage.saveInventoryItem(item, userId, false);

      if (this.isOnline) {
        // Try to sync immediately
        try {
          const response = await apiService.addItem({
            user: userId,
            product: item.product.name,
            weight: item.weight,
            unit: item.unit,
            timestamp: item.timestamp.toISOString()
          });

          if (response.success) {
            // Mark as synced
            await offlineStorage.saveInventoryItem(item, userId, true);
          } else {
            throw new Error(response.error || 'Failed to sync');
          }
        } catch (error) {
          console.warn('Failed to sync immediately, adding to queue:', error);
          await offlineStorage.addToSyncQueue('CREATE', '/items/add', {
            user: userId,
            product: item.product.name,
            weight: item.weight,
            unit: item.unit,
            timestamp: item.timestamp.toISOString()
          }, userId);
        }
      } else {
        // Add to sync queue for later
        await offlineStorage.addToSyncQueue('CREATE', '/items/add', {
          user: userId,
          product: item.product.name,
          weight: item.weight,
          unit: item.unit,
          timestamp: item.timestamp.toISOString()
        }, userId);
      }

      this.notifyStatusChange();
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      throw error;
    }
  }

  // Delete item from local storage and add to sync queue
  public async deleteInventoryItem(itemId: string, userId: string): Promise<void> {
    try {
      // Remove from local storage immediately
      await offlineStorage.deleteInventoryItem(itemId);

      if (this.isOnline) {
        // Try to sync immediately
        try {
          const response = await apiService.deleteItem(itemId);
          if (!response.success) {
            throw new Error(response.error || 'Failed to sync delete');
          }
        } catch (error) {
          console.warn('Failed to sync delete immediately, adding to queue:', error);
          await offlineStorage.addToSyncQueue('DELETE', `/items/delete/${itemId}`, {}, userId);
        }
      } else {
        // Add to sync queue for later
        await offlineStorage.addToSyncQueue('DELETE', `/items/delete/${itemId}`, {}, userId);
      }

      this.notifyStatusChange();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      throw error;
    }
  }

  // Load inventory from local storage
  public async loadInventory(userId: string): Promise<InventoryItem[]> {
    try {
      const items = await offlineStorage.getInventoryItems(userId);
      
      // If online and no items locally, try to fetch from server
      if (this.isOnline && items.length === 0) {
        try {
          const response = await apiService.getItems(userId);
          if (response.success && response.data) {
            // Save fetched items to local storage
            for (const item of response.data) {
              await offlineStorage.saveInventoryItem(item, userId, true);
            }
            return response.data;
          }
        } catch (error) {
          console.warn('Failed to fetch items from server:', error);
        }
      }

      return items;
    } catch (error) {
      console.error('Failed to load inventory:', error);
      return [];
    }
  }

  // Manual sync trigger
  public async syncNow(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    this.notifyStatusChange();

    try {
      // Get all users' sync queues (for demo, we'll use a generic approach)
      const allUsers = ['demo-user']; // In real app, get from auth context
      
      for (const userId of allUsers) {
        await this.syncUserData(userId);
      }

      this.lastSync = new Date();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
    }
  }

  private async syncUserData(userId: string): Promise<void> {
    const syncQueue = await offlineStorage.getSyncQueue(userId);
    
    for (const queueItem of syncQueue) {
      try {
        await this.processSyncQueueItem(queueItem);
        await offlineStorage.removeSyncQueueItem(queueItem.id);
      } catch (error) {
        console.error('Failed to sync item:', queueItem, error);
        
        // Increment retry count
        queueItem.retries++;
        
        // Remove item if too many retries (max 5)
        if (queueItem.retries >= 5) {
          console.warn('Removing item from sync queue after 5 failed attempts:', queueItem);
          await offlineStorage.removeSyncQueueItem(queueItem.id);
        } else {
          await offlineStorage.updateSyncQueueItem(queueItem);
        }
      }
    }
  }

  private async processSyncQueueItem(item: SyncQueueItem): Promise<void> {
    switch (item.action) {
      case 'CREATE':
        if (item.endpoint === '/items/add') {
          const response = await apiService.addItem(item.data);
          if (!response.success) {
            throw new Error(response.error || 'Failed to create item');
          }
        }
        break;

      case 'DELETE':
        if (item.endpoint.startsWith('/items/delete/')) {
          const itemId = item.endpoint.split('/').pop();
          if (itemId) {
            const response = await apiService.deleteItem(itemId);
            if (!response.success) {
              throw new Error(response.error || 'Failed to delete item');
            }
          }
        }
        break;

      case 'UPDATE':
        // Handle updates when implemented
        break;

      default:
        console.warn('Unknown sync action:', item.action);
    }
  }

  // Cache products for offline use
  public async cacheProducts(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Fetch popular products
      const popularResponse = await apiService.getPopularProducts(50);
      if (popularResponse.success && popularResponse.data) {
        await offlineStorage.saveProducts(popularResponse.data);
      }

      // Fetch categories
      const categoriesResponse = await apiService.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        // Store categories in localStorage as they're simple strings
        localStorage.setItem('inwentura_categories', JSON.stringify(categoriesResponse.data));
      }
    } catch (error) {
      console.error('Failed to cache products:', error);
    }
  }

  // Get cached products
  public async getCachedProducts(): Promise<Product[]> {
    return await offlineStorage.getProducts();
  }

  // Cleanup old data
  public async cleanup(): Promise<void> {
    // This could be expanded to remove old synced items, etc.
    console.log('Cleanup completed');
  }

  // Destroy service
  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.statusCallbacks = [];
  }
}

// Export a function to get the singleton instance
let syncServiceInstance: SyncService | null = null;

export const getSyncService = (): SyncService => {
  if (typeof window === 'undefined') {
    // Return a mock service for SSR
    return {
      onStatusChange: () => {},
      removeStatusListener: () => {},
      getStatus: async () => ({
        isOnline: false,
        isSyncing: false,
        lastSync: null,
        pendingItems: 0,
        errors: []
      }),
      addInventoryItem: async () => {},
      deleteInventoryItem: async () => {},
      loadInventory: async () => [],
      syncNow: async () => {},
      cacheProducts: async () => {},
      getCachedProducts: async () => [],
      cleanup: async () => {},
      destroy: () => {}
    } as any;
  }

  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
};

// Don't export a default instance to avoid SSR issues
// Use getSyncService() instead
