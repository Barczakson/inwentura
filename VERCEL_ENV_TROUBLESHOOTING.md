# Vercel Environment Variables Troubleshooting

## Problem
Aplikacja używa hasła awaryjnego `inwentura123` zamiast tego ustawionego w Vercel, a zmienne Google Sheets również nie działają poprawnie.

## Diagnoza

### 1. Sprawdź aktualne zmienne środowiskowe
Uruchom ten endpoint na swojej aplikacji Vercel:
```bash
curl https://inwentura-q9jxg3a68-barczaksons-projects.vercel.app/api/debug-env
```

Powinieneś zobaczyć rzeczywiste wartości i długości zmiennych.

### 2. Sprawdź konfigurację Google Sheets
```bash
curl https://inwentura-q9jxg3a68-barczaksons-projects.vercel.app/api/debug-google-sheets
```

## Możliwe przyczyny i rozwiązania

### 1. Zmienne nie są poprawnie ustawione w Vercel

**Sprawdź w Vercel Dashboard:**
1. Wejdź do [Vercel Dashboard](https://vercel.com/dashboard)
2. Wybierz projekt `inwentura`
3. Przejdź do Settings → Environment Variables
4. Sprawdź, czy zmienne są ustawione dla **wszystkich środowisk** (Production, Preview, Development)

**Wymagane zmienne:**
- `INWENTURA_PASSWORD` - twoje hasło
- `GOOGLE_SHEETS_ID` - ID arkusza Google Sheets
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - email service account
- `GOOGLE_PRIVATE_KEY` - klucz prywatny (z formatowaniem)

### 2. Problem z formatowaniem klucza prywatnego

**Problem:** Klucz prywatny musi zawierać znaki nowej linii.

**Poprawny format:**
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDF...
...
-----END PRIVATE KEY-----
```

**Jak ustawić w Vercel:**
1. Skopiuj cały klucz prywatny (wraz z `-----BEGIN PRIVATE KEY-----` i `-----END PRIVATE KEY-----`)
2. W Vercel Dashboard, w polu wartości, wklej klucz **dokładnie tak, jak jest**
3. Vercel automatycznie obsłuży znaki nowej linii

### 3. Problem z cachem Vercel

**Rozwiązanie:**
1. Po zmianie zmiennych środowiskowych, wykonaj redeploy
2. W Vercel Dashboard, przejdź do Deployments
3. Kliknij trzy kropki (⋯) przy najnowszym deployment
4. Wybierz "Redeploy"

### 4. Problem z uprawnieniami Google Sheets

**Sprawdź:**
1. Czy service account ma dostęp do arkusza
2. Czy arkusz jest udostępniony dla emaila service account
3. Czy w Google Cloud Console API jest włączone

**Jak sprawdzić uprawnienia:**
1. Otwórz arkusz Google Sheets
2. Kliknij "Udostępnij" 
3. Dodaj email service account z uprawnieniami "Edytor"
4. Sprawdź w Google Cloud Console:
   - Google Sheets API v4 jest włączone
   - Service Account ma odpowiednie uprawnienia

### 5. Problem z nazwą zmiennej

**Sprawdź dokładne nazwy:**
- `INWENTURA_PASSWORD` (nie `INWENTURA_PASS` ani inne)
- `GOOGLE_SHEETS_ID` (nie `GOOGLE_SHEET_ID`)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` (nie `GOOGLE_SERVICE_EMAIL`)
- `GOOGLE_PRIVATE_KEY` (nie `GOOGLE_KEY`)

## Testowanie po rozwiązaniu

### 1. Test hasła
```bash
curl -X POST https://inwentura-q9jxg3a68-barczaksons-projects.vercel.app/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"password":"twoje_wlasciwe_haslo"}'
```

Powinno zwrócić `{"success":true}`

### 2. Test zmiennych środowiskowych
```bash
curl https://inwentura-q9jxg3a68-barczaksons-projects.vercel.app/api/debug-env
```

Powinno pokazać rzeczywiste wartości, a nie "NOT_SET"

### 3. Test Google Sheets
```bash
curl https://inwentura-q9jxg3a68-barczaksons-projects.vercel.app/api/debug-google-sheets
```

Powinno pokazać poprawną konfigurację i udaną autoryzację

## Jeśli problem nadal występuje

### 1. Sprawdź logi Vercel
1. W Vercel Dashboard, przejdź do Logs
2. Sprawdź logi funkcji serverless
3. Szukaj błędów związanych ze zmiennymi środowiskowymi

### 2. Sprawdź deployment
1. Upewnij się, że najnowsze zmiany zostały wdrożone
2. Sprawdź, czy commit zawiera wszystkie poprawki

### 3. Skontaktuj się z supportem Vercel
Jeśli wszystkie zmienne są poprawnie ustawione, a nadal nie działają, może to być problem po stronie Vercel.

## Najczęstsze błędy

### 1. Brak redeploy po zmianie zmiennych
**Rozwiązanie:** Zawsze wykonuj redeploy po zmianie zmiennych środowiskowych

### 2. Złe środowisko dla zmiennych
**Rozwiązanie:** Upewnij się, że zmienne są ustawione dla Production, Preview i Development

### 3. Nieprawidłowy format klucza prywatnego
**Rozwiązanie:** Klucz musi zawierać całą zawartość pliku .json z znakami nowej linii

### 4. Brak uprawnień do arkusza
**Rozwiązanie:** Udostępnij arkusz service account z uprawnieniami edytora