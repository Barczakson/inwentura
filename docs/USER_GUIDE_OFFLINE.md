# Przewodnik użytkownika - Praca offline

## Nowe funkcje offline

Aplikacja Inwentura została ulepszona o zaawansowane funkcje offline, które zapewniają:

### ✅ Trwałe przechowywanie danych
- **Dane nie znikają** po odświeżeniu strony lub zamknięciu przeglądarki
- **Automatyczne zapisywanie** wszystkich zmian w inwentarzu
- **Bezpieczne przechowywanie** w lokalnej bazie danych przeglądarki

### ✅ Pełna funkcjonalność offline
- **Dodawanie produktów** bez połączenia z internetem
- **Usuwanie elementów** z inwentarza offline
- **Przeglądanie danych** zawsze dostępne
- **Eksport do CSV/JSON** działa offline

### ✅ Automatyczna synchronizacja
- **Inteligentna synchronizacja** gdy połączenie jest dostępne
- **Kolejkowanie operacji** wykonanych offline
- **Automatyczne wysyłanie** danych po powrocie online
- **Synchronizacja co 2 minuty** w tle

## Jak korzystać

### Status połączenia

W prawym górnym rogu aplikacji znajdziesz wskaźnik statusu:

- 🟢 **Online** - połączenie z internetem aktywne
- 🔴 **Offline** - brak połączenia z internetem
- ⏳ **Synchronizacja...** - trwa wysyłanie danych na serwer
- 📊 **(X oczekujących)** - liczba operacji czekających na synchronizację

### Praca offline

1. **Gdy stracisz połączenie:**
   - Aplikacja automatycznie przełączy się w tryb offline
   - Wszystkie funkcje pozostają dostępne
   - Dane są zapisywane lokalnie

2. **Dodawanie produktów offline:**
   - Wprowadź dane jak zwykle
   - Kliknij "Dodaj do inwentarza"
   - Element zostanie zapisany lokalnie
   - Pojawi się w kolejce do synchronizacji

3. **Po powrocie online:**
   - Aplikacja automatycznie wykryje połączenie
   - Rozpocznie się automatyczna synchronizacja
   - Wszystkie zmiany zostaną wysłane na serwer

### Szczegółowy status synchronizacji

Kliknij na wskaźnik statusu, aby otworzyć szczegółowe informacje:

#### Połączenie
- Status: Online/Offline
- Informacja o trwającej synchronizacji

#### Synchronizacja
- Data i czas ostatniej synchronizacji
- Liczba operacji oczekujących na wysłanie

#### Lokalne dane
- Liczba elementów inwentarza
- Liczba produktów w cache
- Liczba zadań w kolejce synchronizacji

#### Akcje
- **Synchronizuj** - wymusza natychmiastową synchronizację
- **Wyczyść cache** - usuwa lokalne dane (zostaną pobrane ponownie)

### Manualna synchronizacja

Możesz wymusić synchronizację na dwa sposoby:

1. **Przycisk Sync** w prawym górnym rogu
2. **Przycisk Synchronizuj** w dialogu statusu

### Wskazówki

#### ✅ Dobre praktyki
- Regularnie sprawdzaj status synchronizacji
- Pozwól na automatyczną synchronizację gdy masz połączenie
- Nie zamykaj aplikacji podczas synchronizacji

#### ⚠️ Uwagi
- Duże ilości danych mogą wymagać więcej czasu na synchronizację
- W przypadku problemów spróbuj manualnej synchronizacji
- Przy długotrwałych problemach skontaktuj się z administratorem

## Rozwiązywanie problemów

### Problem: Dane nie synchronizują się

**Rozwiązanie:**
1. Sprawdź połączenie z internetem
2. Kliknij przycisk "Sync" aby wymusić synchronizację
3. Sprawdź szczegółowy status w dialogu synchronizacji

### Problem: Aplikacja działa wolno

**Rozwiązanie:**
1. Otwórz dialog statusu synchronizacji
2. Kliknij "Wyczyść cache"
3. Odśwież stronę

### Problem: Duplikaty danych

**Rozwiązanie:**
1. Nie dodawaj tych samych elementów wielokrotnie offline
2. Poczekaj na zakończenie synchronizacji przed kolejnymi operacjami
3. W razie problemów wyczyść cache i zsynchronizuj ponownie

## Bezpieczeństwo danych

### Lokalne przechowywanie
- Dane są przechowywane bezpiecznie w przeglądarce
- Automatyczne szyfrowanie przez przeglądarkę
- Dane są dostępne tylko dla tej aplikacji

### Synchronizacja
- Wszystkie dane są wysyłane przez bezpieczne połączenie HTTPS
- Walidacja danych po stronie serwera
- Automatyczne kopie zapasowe na serwerze

### Prywatność
- Dane nie są udostępniane innym aplikacjom
- Automatyczne czyszczenie przy wylogowaniu
- Możliwość manualnego czyszczenia cache

## Często zadawane pytania

**Q: Czy mogę używać aplikacji bez internetu?**
A: Tak! Wszystkie podstawowe funkcje działają offline.

**Q: Co się stanie z danymi dodanymi offline?**
A: Zostaną automatycznie wysłane na serwer gdy połączenie wróci.

**Q: Jak długo dane są przechowywane lokalnie?**
A: Do momentu wylogowania lub manualnego wyczyszczenia cache.

**Q: Czy mogę eksportować dane offline?**
A: Tak, eksport CSV i JSON działa bez połączenia z internetem.

**Q: Co jeśli synchronizacja się nie powiedzie?**
A: System automatycznie ponowi próbę. Możesz też wymusić synchronizację manualnie.

---

**Potrzebujesz pomocy?** Skontaktuj się z administratorem systemu.
