# System Offline Storage - Inwentura

## Przegląd

Aplikacja Inwentura została wyposażona w zaawansowany system offline storage, który zapewnia:

- **Trwałe przechowywanie danych** - dane nie są tracone po odświeżeniu strony lub utracie połączenia
- **Automatyczną synchronizację** - dane są automatycznie synchronizowane z serwerem gdy połączenie jest dostępne
- **Obsługę offline** - pełna funkcjonalność aplikacji bez połączenia z internetem
- **Inteligentną kolejkę synchronizacji** - operacje wykonane offline są automatycznie wysyłane po powrocie online

## Architektura

### 1. IndexedDB Storage (`offlineStorage.ts`)

Główny system przechowywania danych oparty na IndexedDB:

```typescript
// Inicjalizacja storage
await offlineStorage.init();

// Zapisywanie elementu inwentarza
await offlineStorage.saveInventoryItem(item, userId, synced);

// Pobieranie elementów
const items = await offlineStorage.getInventoryItems(userId);

// Zarządzanie kolejką synchronizacji
await offlineStorage.addToSyncQueue('CREATE', '/items/add', data, userId);
```

**Stores (tabele):**
- `inventory` - elementy inwentarza
- `products` - cache produktów
- `syncQueue` - kolejka operacji do synchronizacji

### 2. Sync Service (`syncService.ts`)

Serwis zarządzający synchronizacją między lokalnym storage a serwerem:

```typescript
// Dodawanie elementu (automatyczna synchronizacja)
await syncService.addInventoryItem(item, userId);

// Usuwanie elementu
await syncService.deleteInventoryItem(itemId, userId);

// Ładowanie danych
const items = await syncService.loadInventory(userId);

// Manualna synchronizacja
await syncService.syncNow();
```

**Funkcje:**
- Automatyczna synchronizacja co 2 minuty
- Obsługa offline - kolejkowanie operacji
- Retry mechanism - ponowne próby przy błędach
- Cache produktów dla szybszego dostępu

### 3. Service Worker (`sw.js`)

Rozszerzony Service Worker obsługujący:
- Cache statycznych zasobów
- Cache API responses
- Kolejkowanie requestów offline
- Automatyczna synchronizacja po powrocie online

## Funkcje

### Automatyczne zapisywanie

Wszystkie operacje są automatycznie zapisywane lokalnie:

```typescript
// Dodawanie elementu - automatycznie zapisane lokalnie i zsynchronizowane
const newItem = {
  id: generateId(),
  product: { name: 'Mleko', category: 'Nabiał' },
  weight: 1,
  unit: 'l',
  timestamp: new Date()
};

await syncService.addInventoryItem(newItem, userId);
```

### Obsługa offline

Gdy aplikacja jest offline:
1. Wszystkie operacje są zapisywane lokalnie
2. Operacje są dodawane do kolejki synchronizacji
3. UI pokazuje status offline
4. Po powrocie online dane są automatycznie synchronizowane

### Status synchronizacji

Aplikacja wyświetla szczegółowy status synchronizacji:

```typescript
interface SyncStatus {
  isOnline: boolean;           // Status połączenia
  isSyncing: boolean;          // Czy trwa synchronizacja
  lastSync: Date | null;       // Ostatnia synchronizacja
  pendingItems: number;        // Liczba oczekujących elementów
  errors: string[];            // Błędy synchronizacji
}
```

### Dialog statusu synchronizacji

Kliknięcie na status synchronizacji otwiera szczegółowy dialog z:
- Statusem połączenia
- Informacjami o synchronizacji
- Statystykami lokalnych danych
- Przyciskami do manualnej synchronizacji i czyszczenia cache

## Użycie

### Podstawowe operacje

```typescript
// Inicjalizacja (automatyczna w aplikacji)
syncService.onStatusChange(setSyncStatus);

// Dodawanie elementu
await syncService.addInventoryItem(item, userId);

// Usuwanie elementu
await syncService.deleteInventoryItem(itemId, userId);

// Ładowanie danych
const inventory = await syncService.loadInventory(userId);
```

### Monitorowanie statusu

```typescript
// Nasłuchiwanie zmian statusu
syncService.onStatusChange((status: SyncStatus) => {
  console.log('Sync status:', status);
  updateUI(status);
});

// Usuwanie listenera
syncService.removeStatusListener(callback);
```

### Manualna synchronizacja

```typescript
// Wymuszenie synchronizacji
await syncService.syncNow();

// Cache produktów
await syncService.cacheProducts();
```

## Konfiguracja

### IndexedDB

```typescript
const DB_NAME = 'InwenturaDB';
const DB_VERSION = 1;
const INVENTORY_STORE = 'inventory';
const PRODUCTS_STORE = 'products';
const SYNC_QUEUE_STORE = 'syncQueue';
```

### Synchronizacja

```typescript
// Interwał automatycznej synchronizacji
const SYNC_INTERVAL = 2 * 60 * 1000; // 2 minuty

// Maksymalna liczba prób synchronizacji
const MAX_RETRIES = 5;

// TTL cache produktów
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minut
```

## Obsługa błędów

System obsługuje różne scenariusze błędów:

1. **Błędy sieci** - operacje są kolejkowane do późniejszej synchronizacji
2. **Błędy serwera** - retry mechanism z eksponencjalnym backoff
3. **Błędy IndexedDB** - fallback do localStorage
4. **Przekroczenie limitów** - automatyczne czyszczenie starych danych

## Testowanie offline

Aby przetestować funkcjonalność offline:

1. Otwórz DevTools (F12)
2. Przejdź do zakładki Network
3. Zaznacz "Offline" lub ustaw "Slow 3G"
4. Dodaj/usuń elementy inwentarza
5. Sprawdź status synchronizacji
6. Przywróć połączenie i obserwuj automatyczną synchronizację

## Migracja danych

System automatycznie migruje dane z localStorage do IndexedDB przy pierwszym uruchomieniu.

## Wydajność

- IndexedDB zapewnia lepszą wydajność niż localStorage
- Asynchroniczne operacje nie blokują UI
- Inteligentne cache'owanie produktów
- Optymalizacja zapytań z indeksami

## Bezpieczeństwo

- Dane są przechowywane lokalnie w przeglądarce użytkownika
- Synchronizacja używa HTTPS
- Walidacja danych po stronie klienta i serwera
- Automatyczne czyszczenie wrażliwych danych przy wylogowaniu
