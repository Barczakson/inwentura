# Supabase Setup Guide

## Krok 1: Utwórz konto Supabase

1. Wejdź na [supabase.com](https://supabase.com)
2. Zarejestruj nowe konto lub zaloguj się
3. Utwórz nowy projekt:
   - Nazwa projektu: `inwentura`
   - Hasło bazy danych: `stworz_silne_haslo`
   - Region: wybierz najbliższy (np. EU West)

## Krok 2: Pobierz dane połączenia

Po utworzeniu projektu, przejdź do:
1. **Project Settings** → **Database**
2. Skopiuj **Connection string** w formacie URI:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
   ```

## Krok 3: Skonfiguruj zmienne środowiskowe na Vercel

1. Wejdź na [vercel.com](https://vercel.com)
2. Wybierz swój projekt `inwentura`
3. Przejdź do **Settings** → **Environment Variables**
4. Dodaj następujące zmienne:

   ```
   Nazwa: DATABASE_URL
   Wartość: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true&connect_timeout=15
   ```

   **Ważne:** Dodaj `?pgbouncer=true&connect_timeout=15` do connection string dla lepszej wydajności na Vercel.

## Krok 4: Uruchom migracje

Po skonfigurowaniu zmiennych środowiskowych, Vercel automatycznie uruchomi migracje przy następnym deployu.

Jeśli chcesz uruchomić migracje ręcznie:

1. Sklonuj repozytorium lokalnie
2. Ustaw DATABASE_URL w pliku `.env`
3. Uruchom:
   ```bash
   npm run db:migrate:deploy
   npm run db:seed
   ```

## Krok 5: Weryfikacja

Po deployu, sprawdź czy API działa:

```bash
# Sprawdź popularne produkty
curl -s "https://twoja-domena.vercel.app/api/inwentura/products/popular" | jq .

# Dodaj nowy produkt
curl -X POST "https://twoja-domena.vercel.app/api/inwentura/products/add" \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "category": "test", "defaultUnit": "szt"}' | jq .
```

## Krok 6: Dodaj przykładowe dane (opcjonalnie)

Aby dodać przykładowe produkty, uruchom:

```bash
curl -X POST "https://twoja-domena.vercel.app/api/inwentura/products/initialize" | jq .
```

## Troubleshooting

### Problem: `error: could not translate host name`
- Upewnij się, że connection string jest poprawny
- Sprawdź, czy projekt Supabase jest aktywny

### Problem: `error: password authentication failed`
- Sprawdź hasło w connection string
- Upewnij się, że używasz poprawnego hasła bazy danych

### Problem: Brak danych po migracji
- Upewnij się, że migracje zostały uruchomione
- Sprawdź logi Vercel pod kątem błędów

## Bezpieczeństwo

- Nigdy nie udostępniaj swojego hasła do bazy danych
- Używaj silnych haseł
- Regularnie aktualizuj zmienne środowiskowe

## Przykładowy Connection String

```
postgresql://postgres:your_strong_password@db.abcdefg.supabase.co:5432/postgres?pgbouncer=true&connect_timeout=15
```