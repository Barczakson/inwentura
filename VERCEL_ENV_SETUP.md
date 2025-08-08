# Konfiguracja zmiennych środowiskowych na Vercel

## 🚀 Krok 1: Pushuj kod do GitHub

Najpierw pushuj swój kod do repozytorium GitHub (bez pliku .env):

```bash
git add .
git commit -m "feat: Add Google Sheets integration"
git push origin master
```

## 🌐 Krok 2: Skonfiguruj Vercel Environment Variables

### 2.1 Przez Vercel Dashboard
1. **Przejdź do [vercel.com](https://vercel.com)**
2. **Zaloguj się i wybierz swój projekt**
3. **Kliknij "Settings" (ikona ⚙️)**
4. **Wybierz "Environment Variables" z lewego menu**
5. **Dodaj zmienne:**

| Name | Value | Environment |
|------|-------|-------------|
| `GOOGLE_SHEETS_ID` | `twój_id_arkusza` | Production, Preview, Development |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `twój_email@projekt.iam.gserviceaccount.com` | Production, Preview, Development |
| `GOOGLE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\nTWOJ_KLICZ\n-----END PRIVATE KEY-----\n` | Production, Preview, Development |
| `INWENTURA_PASSWORD` | `twoje_hasło` | Production, Preview, Development |

**WAŻNE:** Dla `GOOGLE_PRIVATE_KEY` - zachowaj dokładnie ten format z `\n` i cudzysłowami!

### 2.2 Przez Vercel CLI (alternatywa)
Jeśli masz zainstalowany Vercel CLI:

```bash
# Zaloguj się
vercel login

# Dodaj zmienne środowiskowe
vercel env add GOOGLE_SHEETS_ID production
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL production  
vercel env add GOOGLE_PRIVATE_KEY production
vercel env add INWENTURA_PASSWORD production

# Powtórz dla innych środowisk
vercel env add GOOGLE_SHEETS_ID preview
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL preview
vercel env add GOOGLE_PRIVATE_KEY preview
vercel env add INWENTURA_PASSWORD preview
```

## 🔄 Krok 3: Redeploy po zmianach zmiennych

Po dodaniu zmiennych środowiskowych:

1. **Vercel automatycznie zredeployuje aplikację**
2. **Lub możesz wymusić redeploy:**
   - W dashboard: "Deployments" → "Redeploy"
   - Przez CLI: `vercel --prod`

## 🧪 Krok 4: Sprawdź konfigurację

### 4.1 Sprawdź logi deploya
W Vercel Dashboard:
1. **"Deployments" → wybierz najnowszy deployment**
2. **Kliknij "Function Logs"**
3. **Szukaj błędów związanych z Google Sheets**

### 4.2 Testuj aplikację
1. **Otwórz deployed URL**
2. **Sprawdź czy Google Sheets działa:**
   - Wpisz produkt w polu wyszukiwania
   - Powinny pojawić się produkty z Twojego arkusza
   - Sprawdź czy nie ma błędów w konsoli (F12)

## 🐛 Debugowanie problemów

### Problem: "Google Sheets nie jest skonfigurowany"
**Rozwiązanie:**
1. Sprawdź czy wszystkie 3 zmienne są dodane w Vercel
2. Sprawdź format `GOOGLE_PRIVATE_KEY` - musi być w cudzysłowach z `\n`
3. Upewnij się, że redeploy się powiódł

### Problem: "Failed to get access token"
**Rozwiązanie:**
1. Sprawdź poprawność klucza prywatnego
2. Upewnij się, że Service Account ma dostęp do arkusza
3. Sprawdź czy Google Sheets API jest włączone

### Problem: "403 Forbidden"
**Rozwiązanie:**
1. Sprawdź uprawnienia Service Account do arkusza (Editor)
2. Sprawdź poprawność ID arkusza
3. Upewnij się, że arkusz ma nazwę "Produkty"

## 📝 Sprawdzenie konfiguracji w kodzie

Możesz dodać endpoint do debugowania, który pokaże konfigurację:

```typescript
// src/app/api/debug/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    googleSheetsId: process.env.GOOGLE_SHEETS_ID ? 'Set' : 'Not set',
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Not set',
    privateKey: process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Not set',
    password: process.env.INWENTURA_PASSWORD ? 'Set' : 'Not set',
  });
}
```

Następnie testuj: `https://twoja-app.vercel.app/api/debug`

## 🔒 Bezpieczeństwo na Vercel

### Vercel automatycznie:
- **Szyfruje wszystkie zmienne środowiskowe**
- **Nigdy nie pokazuje ich w logach**
- **Nie udostępnia ich w frontendzie** (tylko w server-side code)

### Dobre praktyki:
1. **Używaj różnych wartości** dla Production/Preview/Development
2. **Regularnie rotuj klucze** Service Account
3. **Monitoruj logi** pod kątem nieautoryzowanego dostępu
4. **Używaj silnych haseł** dla `INWENTURA_PASSWORD`

---

## ✅ Checklist przed wdrożeniem na Vercel

- [ ] Kod jest w GitHub (bez .env)
- [ ] Projekt jest podłączony do Vercel
- [ ] Wszystkie zmienne środowiskowe są dodane w Vercel dashboard
- [ ] Format `GOOGLE_PRIVATE_KEY` jest poprawny
- [ ] Redeploy zakończony sukcesem
- [ ] Aplikacja działa na production URL
- [ ] Google Sheets integration działa poprawnie
- [ ] Logi nie pokazują błędów

Gotowe! Teraz Twoja aplikacja na Vercel będzie miała dostęp do Google Sheets, a Twoje dane będą bezpieczne.