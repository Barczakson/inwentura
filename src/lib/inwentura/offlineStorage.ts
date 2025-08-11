import { InventoryItem, Product } from '@/types/inwentura';

// IndexedDB configuration
const DB_NAME = 'InwenturaDB';
const DB_VERSION = 1;
const INVENTORY_STORE = 'inventory';
const PRODUCTS_STORE = 'products';
const SYNC_QUEUE_STORE = 'syncQueue';

// Storage interface
export interface StorageItem {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
  userId: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
  userId: string;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create inventory store
        if (!db.objectStoreNames.contains(INVENTORY_STORE)) {
          const inventoryStore = db.createObjectStore(INVENTORY_STORE, { keyPath: 'id' });
          inventoryStore.createIndex('userId', 'userId', { unique: false });
          inventoryStore.createIndex('timestamp', 'timestamp', { unique: false });
          inventoryStore.createIndex('synced', 'synced', { unique: false });
        }

        // Create products store
        if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
          const productsStore = db.createObjectStore(PRODUCTS_STORE, { keyPath: 'id' });
          productsStore.createIndex('name', 'name', { unique: false });
          productsStore.createIndex('category', 'category', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
          syncStore.createIndex('userId', 'userId', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Inventory operations
  async saveInventoryItem(item: InventoryItem, userId: string, synced: boolean = false): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const storageItem: StorageItem = {
      id: item.id,
      data: item,
      timestamp: Date.now(),
      synced,
      userId
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([INVENTORY_STORE], 'readwrite');
      const store = transaction.objectStore(INVENTORY_STORE);
      const request = store.put(storageItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getInventoryItems(userId: string): Promise<InventoryItem[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([INVENTORY_STORE], 'readonly');
      const store = transaction.objectStore(INVENTORY_STORE);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const items = request.result
          .map((item: StorageItem) => item.data)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteInventoryItem(itemId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([INVENTORY_STORE], 'readwrite');
      const store = transaction.objectStore(INVENTORY_STORE);
      const request = store.delete(itemId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(action: SyncQueueItem['action'], endpoint: string, data: any, userId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const queueItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0,
      userId
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.put(queueItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(userId: string): Promise<SyncQueueItem[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const items = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncQueueItem(itemId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.delete(itemId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Products cache
  async saveProducts(products: Product[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRODUCTS_STORE], 'readwrite');
      const store = transaction.objectStore(PRODUCTS_STORE);
      
      // Clear existing products
      store.clear();
      
      // Add new products
      products.forEach(product => {
        store.put(product);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getProducts(): Promise<Product[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRODUCTS_STORE], 'readonly');
      const store = transaction.objectStore(PRODUCTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([INVENTORY_STORE, PRODUCTS_STORE, SYNC_QUEUE_STORE], 'readwrite');
      
      transaction.objectStore(INVENTORY_STORE).clear();
      transaction.objectStore(PRODUCTS_STORE).clear();
      transaction.objectStore(SYNC_QUEUE_STORE).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getStorageStats(): Promise<{ inventoryCount: number; productsCount: number; syncQueueCount: number }> {
    await this.init();
    if (!this.db) return { inventoryCount: 0, productsCount: 0, syncQueueCount: 0 };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([INVENTORY_STORE, PRODUCTS_STORE, SYNC_QUEUE_STORE], 'readonly');
      
      let inventoryCount = 0;
      let productsCount = 0;
      let syncQueueCount = 0;
      let completed = 0;

      const checkComplete = () => {
        completed++;
        if (completed === 3) {
          resolve({ inventoryCount, productsCount, syncQueueCount });
        }
      };

      transaction.objectStore(INVENTORY_STORE).count().onsuccess = (e) => {
        inventoryCount = (e.target as IDBRequest).result;
        checkComplete();
      };

      transaction.objectStore(PRODUCTS_STORE).count().onsuccess = (e) => {
        productsCount = (e.target as IDBRequest).result;
        checkComplete();
      };

      transaction.objectStore(SYNC_QUEUE_STORE).count().onsuccess = (e) => {
        syncQueueCount = (e.target as IDBRequest).result;
        checkComplete();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
