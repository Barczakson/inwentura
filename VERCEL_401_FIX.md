# 🚨 PROBLEM: 401 Unauthorized na Vercel - Rozwiązanie

## 🔍 **Diagnoza problemu**

**Objawy:**
- Aplikacja zwraca 401 Unauthorized na wszystkich endpointach
- Curl pokazuje "Redirecting..." zamiast odpowiedzi API
- Build na Vercel kończy się sukcesem, ale aplikacja nie działa

**Przyczyna:** Custom server (`server.ts`) konfliktuje z Vercel's serverless architecture.

---

## 🛠️ **Wykonane zmiany**

### **1. Zaktualizowano package.json**
```json
"scripts": {
  "dev": "nodemon --exec \"npx tsx server.ts\" --watch server.ts --watch src --ext ts,tsx,js,jsx 2>&1 | tee dev.log",
  "build": "prisma generate && next build",
  "build:vercel": "prisma generate && next build",
  "start": "next start",  // ← ZMIANA: standardowy Next.js start
  "start:local": "NODE_ENV=production tsx server.ts 2>&1 | tee server.log",  // ← Nowy skrypt dla local
  // ...
}
```

### **2. Dodano vercel.json**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/**/*": {
      "maxDuration": 30
    }
  }
}
```

### **3. Zaktualizowano .vercelignore**
```
# Custom server - ignore for Vercel deployment
server.ts

# Logs
*.log
dev.log
server.log

# Research files
research_*.js
*_GUIDE.md
*_ANALYSIS.md
```

---

## 🚀 **Co musisz zrobić teraz**

### **Krok 1: Push zmian do GitHub**
```bash
# Skonfiguruj dostęp do GitHub (jeśli jeszcze nie masz)
git remote add origin https://github.com/Barczakson/inwentura.git

# Push zmian
git push -u origin master
```

**Jeśli masz problem z uwierzytelnianiem:**
1. **Opcja A:** Użyj GitHub CLI
   ```bash
   gh auth login
   git push -u origin master
   ```

2. **Opcja B:** Użyj Personal Access Token
   - Wejdź na GitHub → Settings → Developer settings → Personal access tokens
   - Wygeneruj token z uprawnieniami `repo`
   - Użyj tokena jako hasła przy push

### **Krok 2: Czekaj na auto-deploy na Vercel**
- Po pushu do GitHub, Vercel automatycznie zbuduje aplikację
- Build powinien zakończyć się sukcesem (jak poprzednio)

### **Krok 3: Testuj aplikację**
```bash
# Testuj debug endpoint
curl https://inwentura-6e6ugd4nq-barczaksons-projects.vercel.app/api/debug-env

# Powinno pokazać:
{
  "google_sheets_id": "NOT_SET",
  "google_service_account_email": "NOT_SET", 
  "google_private_key": "NOT_SET",
  "inwentura_password": "NOT_SET"
}
```

### **Krok 4: Dodaj zmienne środowiskowe w Vercel**
1. **Przejdź do Vercel Dashboard**
2. **Settings → Environment Variables**
3. **Dodaj zmienne:**
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `INWENTURA_PASSWORD`
4. **Upewnij się, że są ustawione dla Production, Preview, Development**

### **Krok 5: Redeploy po dodaniu zmiennych**
- Vercel automatycznie zredeployuje aplikację
- Testuj ponownie `/api/debug-env`

---

## 🔧 **Jeśli nadal nie działa**

### **Sprawdź logi Vercel:**
1. **Vercel Dashboard → Deployments**
2. **Wybierz najnowsze deployment**
3. **Sprawdź Build Log i Function Log**

### **Możliwe dodatkowe problemy:**
1. **Socket.IO nie działa na Vercel** - to jest normalne, Vercel nie wspiera WebSocket w standardowy sposób
2. **Brak niektórych funkcji** - aplikacja będzie działać, ale bez real-time features

---

## ✅ **Co powinno działać po tych zmianach**

- ✅ Aplikacja główna (`/`)
- ✅ API endpoints (`/api/*`)
- ✅ Google Sheets integration (po skonfigurowaniu zmiennych)
- ✅ Wszystkie funkcje oprócz Socket.IO

---

## 🎯 **Podsumowanie**

**Problem:** Custom server konfliktował z Vercel
**Rozwiązanie:** Przejście na standardowy Next.js deployment
**Status:** Zmiany gotowe do wdrożenia

Po pushu do GitHub i dodaniu zmiennych środowiskowych w Vercel, aplikacja powinna działać poprawnie!