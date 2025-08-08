# 🔍 Analiza problemu: Zmienne środowiskowe Vercel nie są poprawnie wczytywane

Przeprowadziłem szczegółową analizę kodu aplikacji Inwentura i znalazłem **kilka potencjalnych przyczyn**, dlaczego zmienne środowiskowe mogą nie być poprawnie wczytywane na Vercel.

---

## 📋 **Znalezione problemy w kodzie**

### **1. Problem: Brak prefiksu NEXT_PUBLIC_ (NIE DOTYCZY TWOJEJ APLIKACJI)**

**Status:** ✅ **POPRAWNIE SKONFIGUROWANE**
- Twoje zmienne (`GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `INWENTURA_PASSWORD`) są używane **tylko po stronie serwera**
- Nie potrzebują prefiksu `NEXT_PUBLIC_` 
- Są poprawnie odczytywane przez `process.env` w API Routes i server-side code

**Lokalizacja w kodzie:**
```typescript
// ✅ POPRAWNIE - używane w server-side
const appPassword = process.env.INWENTURA_PASSWORD || 'inwentura123';
const sheetsId = process.env.GOOGLE_SHEETS_ID || '';
```

---

### **2. Problem: Custom server (server.ts) może powodować problemy**

**Status:** ⚠️ **POTENCJALNY PROBLEM**

**Problem:** Twoja aplikacja używa custom server (`server.ts`) zamiast standardowego Next.js server. Na Vercel to może powodować problemy:

```typescript
// server.ts - może nie działać poprawnie na Vercel
const server = createServer((req, res) => {
  if (req.url?.startsWith('/api/socketio')) {
    return;
  }
  handle(req, res);
});
```

**Dlaczego to problem:**
- Vercel oczekuje standardowego Next.js entry point
- Custom server może nie mieć dostępu do zmiennych środowiskowych w ten sam sposób
- Socket.IO integration może być problematyczna na serverless platformie

---

### **3. Problem: Brak obsługi edge/runtime environment**

**Status:** ⚠️ **POTENCJALNY PROBLEM**

**Problem:** Next.js na Vercel może mieć problemy z dostępem do zmiennych środowiskowych w różnych runtime environments:

```typescript
// Potencjalny problem - brak obsługi różnych środowisk
const dev = process.env.NODE_ENV !== 'production';
```

**Rozwiązanie:** Dodaj explicit handling dla Vercel environments:

```typescript
const dev = process.env.NODE_ENV !== 'production';
const isVercel = process.env.VERCEL === '1';
```

---

### **4. Problem: Brak walidacji zmiennych środowiskowych**

**Status:** ⚠️ **POTENCJALNY PROBLEM**

**Problem:** Aplikacja nie waliduje, czy zmienne są poprawnie załadowane przed użyciem:

```typescript
// Obecnie - brak walidacji
const sheetsId = process.env.GOOGLE_SHEETS_ID || '';

// Lepsze podejście
if (!process.env.GOOGLE_SHEETS_ID) {
  console.error('GOOGLE_SHEETS_ID is not configured');
}
```

---

## 🎯 **Najbardziej prawdopodobne przyczyny problemu**

### **1. Custom server conflicts z Vercel (NAJBARDZIEJ PRAWDOPODOBNE)**

**Problem:** Vercel jest zaprojektowany dla standardowego Next.js deployment. Twój custom server (`server.ts`) z Socket.IO może nie być kompatybilny.

**Objawy:**
- Aplikacja działa lokalnie, ale nie na Vercel
- Zmienne środowiskowe są "puste" lub `undefined`
- Błędy w build lub runtime

**Rozwiązanie:**
1. **Opcja A:** Usuń custom server i użyj standardowego Next.js
2. **Opcja B:** Skonfiguruj Vercel do obsługi custom server (trudniejsze)

---

### **2. Build-time vs Runtime variable access**

**Problem:** Zmienne środowiskowe mogą być dostępne podczas buildu, ale nie podczas runtime.

**Objawy:**
- Aplikacja buduje się poprawnie
- Zmienne są widoczne w build logs
- Ale w runtime są `undefined`

**Rozwiązanie:**
```typescript
// Sprawdź dostępność zmiennych w runtime
console.log('Runtime check:', {
  hasSheetsId: !!process.env.GOOGLE_SHEETS_ID,
  hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  hasKey: !!process.env.GOOGLE_PRIVATE_KEY
});
```

---

### **3. Vercel environment scope**

**Problem:** Zmienne są ustawione tylko dla jednego environment (np. Production), a testujesz w Preview.

**Rozwiązanie:** Upewnij się, że zmienne są ustawione dla wszystkich environments:
- `Production` (dla głównej domeny)
- `Preview` (dla branch deployments)
- `Development` (dla local development)

---

## 🔧 **Rozwiązania - od najprostszych do najskuteczniejszych**

### **Krok 1: Dodaj endpoint do debugowania**

Utworzyłem endpoint `/api/debug-env` który pokaże status wszystkich zmiennych:

```bash
# Testuj na Vercel:
curl https://twoja-app.vercel.app/api/debug-env

# Testuj lokalnie:
curl http://localhost:3000/api/debug-env
```

To pokaże dokładnie, które zmienne są załadowane.

---

### **Krok 2: Sprawdź Vercel configuration**

1. **Przejdź do Vercel Dashboard**
2. **Settings → Environment Variables**
3. **Sprawdź dla każdego environment:**
   - ✅ `GOOGLE_SHEETS_ID`
   - ✅ `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - ✅ `GOOGLE_PRIVATE_KEY`
   - ✅ `INWENTURA_PASSWORD`
4. **Upewnij się, że wszystkie są ustawione dla Production, Preview i Development**

---

### **Krok 3: Sprawdź build logs**

1. **Vercel Dashboard → Deployments**
2. **Wybierz ostatnie deployment**
3. **Sprawdź Build Log i Function Log**
4. **Szukaj błędów związanych ze zmiennymi środowiskowymi**

---

### **Krok 4: Tymczasowo usuń custom server (NAJBARDZIEJ SKUTECZNE)**

**Problem:** Custom server (`server.ts`) jest najprawdopodobniejszą przyczyną.

**Rozwiązanie:**

1. **Zmień package.json:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

2. **Usuń server.ts** (lub zignoruj go na Vercel)

3. **Dodaj vercel.json:**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
```

---

### **Krok 5: Dodaj walidację zmiennych**

Dodaj w kodzie walidację, aby upewnić się, że zmienne są załadowane:

```typescript
// Na początku googleSheets.ts
if (!process.env.GOOGLE_SHEETS_ID) {
  console.error('CRITICAL: GOOGLE_SHEETS_ID is not configured');
}
if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
  console.error('CRITICAL: GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured');
}
if (!process.env.GOOGLE_PRIVATE_KEY) {
  console.error('CRITICAL: GOOGLE_PRIVATE_KEY is not configured');
}
```

---

## 📊 **Plan diagnostyczny krok po kroku**

### **Krok 1: Test debug endpoint**
```bash
# Na Vercel
curl https://twoja-app.vercel.app/api/debug-env

# Powinno pokazać:
{
  "google_sheets_id": "SET",
  "google_service_account_email": "SET", 
  "google_private_key": "SET",
  "inwentura_password": "SET"
}
```

### **Krok 2: Jeśli pokazuje "NOT_SET"**
- Sprawdź Vercel Environment Variables
- Upewnij się, że redeploy po zmianach

### **Krok 3: Jeśli pokazuje "SET" ale nadal nie działa**
- Problem jest w kodzie (prawdopodobnie custom server)
- Przejrzyj Function Logs w Vercel

### **Krok 4: Ostateczne rozwiązanie**
Usuń custom server i użyj standardowego Next.js deployment.

---

## 🎯 **Podsumowanie**

**Najbardziej prawdopodobna przyczyna:** Custom server (`server.ts`) konfliktuje z Vercel's serverless architecture.

**Najszybsze rozwiązanie:** Użyj endpointu `/api/debug-env` aby zdiagnozować problem.

**Najskuteczniejsze rozwiązanie:** Usuń custom server i użyj standardowego Next.js deployment na Vercel.

---

## 🚀 **Natychmiastowe działania**

1. **Push current code** z debug endpoint
2. **Test `/api/debug-env`** na Vercel
3. **Check Vercel Environment Variables** 
4. **If still not working, remove custom server**

Ten plan diagnostyczny powinien szybko zidentyfikować i rozwiązać problem ze zmiennymi środowiskowymi na Vercel.