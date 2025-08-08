# Vercel Environment Variables Setup

## Problem
Zmienne środowiskowe nie działały poprawnie z powodu:
1. Używania niestandardowego serwera (`server.ts`) zamiast standardowego Next.js
2. Próby dostępu do `process.env` po stronie klienta

## Rozwiązania wdrożone

### 1. Naprawa serwera deweloperskiego
- **Plik**: `package.json`
- **Zmiana**: Skrypt `dev` z `nodemon --exec "npx tsx server.ts"` na `next dev`
- **Powód**: Vercel wymaga standardowej konfiguracji Next.js

### 2. Naprawa weryfikacji hasła
- **Problem**: `process.env.INWENTURA_PASSWORD` używane w komponencie klienta
- **Rozwiązanie**: Przeniesienie weryfikacji do API route `/api/auth/verify`
- **Pliki**:
  - `src/components/inwentura/InwenturaApp.tsx` - aktualizacja `handleLogin()`
  - `src/app/api/auth/verify/route.ts` - nowe API route

## Konfiguracja zmiennych środowiskowych w Vercel

### Wymagane zmienne
Ustaw te zmienne w Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Ochrona aplikacji (wymagane)
INWENTURA_PASSWORD=twoje_haslo

# Baza danych (opcjonalne - dla lokalnego rozwoju)
DATABASE_URL=file:///tmp/custom.db

# Google Sheets (opcjonalne - dla integracji z arkuszami)
GOOGLE_SHEETS_ID=twoj_id_arkusza
GOOGLE_SERVICE_ACCOUNT_EMAIL=twoj_email@serviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Jak ustawić zmienne w Vercel
1. Wejdź do [Vercel Dashboard](https://vercel.com/dashboard)
2. Wybierz swój projekt
3. Przejdź do Settings → Environment Variables
4. Dodaj zmienne jedna po drugiej:
   - **Name**: `INWENTURA_PASSWORD`
   - **Value**: `twoje_haslo` (zmień na swoje hasło)
   - **Environment**: Production, Preview, Development
5. Kliknij "Add"
6. Powtórz dla innych zmiennych
7. Kliknij "Save" i "Redeploy"

### Testowanie zmiennych środowiskowych
Po wdrożeniu, przetestuj endpoint:
```bash
curl https://twoja-app.vercel.app/api/debug-env
```

Powinieneś zobaczyć:
```json
{
  "timestamp": "2025-08-08T11:19:45.465Z",
  "environment": "production",
  "google_sheets_id": "SET",
  "google_service_account_email": "SET", 
  "google_private_key": "SET",
  "inwentura_password": "SET",
  "database_url": "SET"
}
```

## Ważne uwagi

### 1. Hasło aplikacji
- Domyślne hasło: `inwentura123`
- Zmień je na bezpieczne hasło w Vercel Environment Variables
- Hasło jest wymagane do uzyskania dostępu do aplikacji

### 2. Google Sheets Integration
- Jeśli nie chcesz używać Google Sheets, aplikacja będzie działać z mock produktami
- Aby skonfigurować Google Sheets, postępuj zgodnie z `GOOGLE_SHEETS_SETUP_GUIDE.md`

### 3. Wykluczenie plików
- Plik `.vercelignore` już wyklucza `server.ts` i inne niepotrzebne pliki
- Zmienne środowiskowe są wykluczone z repozytorium

## Rozwiązywanie problemów

### Problem: "Connection refused"
**Rozwiązanie**: Upewnij się, że aplikacja jest wdrożona i działa na Vercel

### Problem: "NOT_SET" dla zmiennych
**Rozwiązanie**: Sprawdź, czy zmienne są poprawnie ustawione w Vercel Dashboard i czy redeploy został wykonany

### Problem: Hasło nie działa
**Rozwiązanie**: 
1. Sprawdź, czy `INWENTURA_PASSWORD` jest ustawione w Vercel
2. Upewnij się, że redeploy został wykonany po zmianie zmiennych
3. Przetestuj endpoint `/api/auth/verify`

### Problem: 401 Unauthorized
**Rozwiązanie**: Upewnij się, że SSO jest wyłączone w Vercel Dashboard → Settings → Authentication