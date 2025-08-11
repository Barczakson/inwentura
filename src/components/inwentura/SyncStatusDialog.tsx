'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Wifi, WifiOff, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { SyncStatus } from '@/lib/inwentura/syncService';
import { offlineStorage } from '@/lib/inwentura/offlineStorage';
import { useSyncService } from '@/hooks/useSyncService';

interface SyncStatusDialogProps {
  children: React.ReactNode;
}

export default function SyncStatusDialog({ children }: SyncStatusDialogProps) {
  const { syncService, syncStatus } = useSyncService();
  const [storageStats, setStorageStats] = useState({
    inventoryCount: 0,
    productsCount: 0,
    syncQueueCount: 0
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Update status when dialog opens
      updateStats();
    }
  }, [isOpen]);

  const updateStats = async () => {
    try {
      const stats = await offlineStorage.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to get storage stats:', error);
    }
  };

  const handleManualSync = async () => {
    if (syncService) {
      await syncService.syncNow();
      await updateStats();
    }
  };

  const handleClearCache = async () => {
    if (confirm('Czy na pewno chcesz wyczyścić cache? Dane zostaną ponownie pobrane z serwera.')) {
      try {
        await offlineStorage.clearAllData();
        await updateStats();
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {syncStatus.isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Status synchronizacji
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Połączenie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm">Status:</span>
                <Badge variant={syncStatus.isOnline ? 'default' : 'destructive'}>
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              {syncStatus.isSyncing && (
                <div className="flex items-center gap-2 mt-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Synchronizacja w toku...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Synchronizacja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Ostatnia sync:</span>
                <span className="text-sm text-muted-foreground">
                  {syncStatus.lastSync 
                    ? syncStatus.lastSync.toLocaleString('pl-PL')
                    : 'Nigdy'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Oczekujące:</span>
                <Badge variant={syncStatus.pendingItems > 0 ? 'secondary' : 'outline'}>
                  {syncStatus.pendingItems}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Storage Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lokalne dane</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Inwentarz:</span>
                <span className="text-sm text-muted-foreground">
                  {storageStats.inventoryCount} elementów
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Produkty:</span>
                <span className="text-sm text-muted-foreground">
                  {storageStats.productsCount} produktów
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Kolejka sync:</span>
                <span className="text-sm text-muted-foreground">
                  {storageStats.syncQueueCount} zadań
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {syncStatus.errors.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Błędy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {syncStatus.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleManualSync}
              disabled={syncStatus.isSyncing || !syncStatus.isOnline}
              className="flex-1"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              Synchronizuj
            </Button>
            <Button 
              onClick={handleClearCache}
              variant="outline"
              size="sm"
            >
              Wyczyść cache
            </Button>
          </div>

          {/* Tips */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="font-medium">Wskazówki:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Dane są automatycznie zapisywane lokalnie</li>
                  <li>• Synchronizacja odbywa się automatycznie co 2 minuty</li>
                  <li>• W trybie offline wszystkie zmiany są kolejkowane</li>
                  <li>• Po powrocie online dane zostaną zsynchronizowane</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
