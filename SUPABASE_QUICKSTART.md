# Supabase Quick Start

## Szybka konfiguracja dla Supabase

### 1. Utwórz projekt Supabase

1. Wejdź na [supabase.com](https://supabase.com)
2. Zaloguj się i utwórz nowy projekt
3. Skopiuj connection string z Project Settings → Database

### 2. Skonfiguruj .env

Utwórz/edytuj plik `.env`:

```env
DATABASE_URL=postgresql://postgres:[HASŁO]@db.[PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true&connect_timeout=15

# Google Sheets (opcjonalnie)
GOOGLE_SHEETS_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# Hasło do aplikacji
INWENTURA_PASSWORD=inwentura123
```

### 3. Uruchom deployment setup

```bash
npm run deploy:supabase
```

Ten skrypt:
- ✅ Sprawdzi konfigurację
- ✅ Przetestuje połączenie z bazą
- ✅ Uruchomi migracje
- ✅ Doda przykładowe dane
- ✅ Zbuduje aplikację

### 4. Deploy na Vercel

1. Ustaw `DATABASE_URL` w Environment Variables na Vercel
2. Wypchnij zmiany do repozytorium
3. Vercel automatycznie zdeployuje aplikację

### 5. Testowanie

Po deploycie sprawdź API:

```bash
# Sprawdź produkty
curl -s "https://twoja-domena.vercel.app/api/inwentura/products/popular" | jq .

# Dodaj produkt
curl -X POST "https://twoja-domena.vercel.app/api/inwentura/products/add" \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "category": "test", "defaultUnit": "szt"}' | jq .
```

## Gotowe! 🎉

Twoja aplikacja Inwentura jest teraz skonfigurowana z Supabase i gotowa do użycia.