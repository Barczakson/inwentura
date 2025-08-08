# 🚨 PROBLEM: Vercel SSO Authentication - Rozwiązanie

## 🔍 **Diagnoza problemu**

**Objawy:**
- Zamiast odpowiedzi API otrzymujesz stronę logowania Vercel
- Curl pokazuje HTML z formularzem "Authentication Required"
- Każdy request jest przekierowywany do SSO

**Przyczyna:** Projekt ma włączoną ochronę Vercel Authentication

---

## 🛠️ **Rozwiązanie: Wyłącz Vercel Authentication**

### **Krok 1: Wyłącz SSO w Vercel Dashboard**

1. **Przejdź do [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Wybierz swój projekt: `inwentura`**
3. **Kliknij "Settings" (ikona ⚙️)**
4. **Wybierz "Authentication" z lewego menu**
5. **Wyłącz wszystkie opcje:**
   - ❌ **Enable SSO** (wyłącz)
   - ❌ **Require authentication for all routes** (wyłącz)
   - ❌ **Enable Team Authentication** (jeśli włączone)
6. **Kliknij "Save"**

### **Krok 2: Sprawdź inne ustawienia bezpieczeństwa**

1. **Settings → "Security":**
   - Upewnij się, że **"Protect all routes"** jest wyłączone
   - Sprawdź, czy nie ma innych reguł blokujących

### **Krok 3: Redeploy aplikację**

Po wyłączeniu SSO, Vercel powinien automatycznie zredeployować aplikację.

---

## 🧪 **Krok 4: Testuj ponownie**

Po wyłączeniu SSO, testuj endpoint:
```bash
curl https://inwentura-6e6ugd4nq-barczaksons-projects.vercel.app/api/debug-env
```

**Oczekiwany wynik:**
```json
{
  "google_sheets_id": "NOT_SET",
  "google_service_account_email": "NOT_SET", 
  "google_private_key": "NOT_SET",
  "inwentura_password": "NOT_SET"
}
```

---

## 📋 **Jeśli nadal nie działa**

### **Sprawdź Vercel Edge Configuration:**
1. **Settings → "Edge Configuration"**
2. Upewnij się, że nie ma reguł redirectujących

### **Sprawdź Custom Headers:**
1. **Settings → "Headers"**
2. Usuń wszelkie nagłówki autoryzacyjne

### **Sprawdź Rewrites:**
1. **Settings → "Rewrites"**
2. Upewnij się, że nie ma reguł przekierowujących do logowania

---

## 🎯 **Co powinno się wydarzyć po wyłączeniu SSO:**

- ✅ API endpoints będą dostępne bez logowania
- ✅ `/api/debug-env` zwróci JSON z informacją o zmiennych
- ✅ Główna aplikacja będzie działać normalnie
- ✅ Będziesz mógł skonfigurować zmienne środowiskowe
- ✅ Google Sheets integration będzie działać po dodaniu zmiennych

---

## 🚀 **Następne kroki po wyłączeniu SSO:**

1. **Testuj `/api/debug-env`**
2. **Dodaj zmienne środowiskowe** w Vercel Dashboard:
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `INWENTURA_PASSWORD`
3. **Redeploy po dodaniu zmiennych**
4. **Testuj Google Sheets integration**
5. **Ciesz się działającą aplikacją!**

---

## 📝 **Podsumowanie**

**Problem:** Vercel SSO Authentication blokuje dostęp do API
**Rozwiązanie:** Wyłącz SSO w Vercel Dashboard
**Status:** Gotowe do wdrożenia

To jest problem z konfiguracją Vercel, nie z kodem! Po wyłączeniu SSO wszystko powinno działać poprawnie.