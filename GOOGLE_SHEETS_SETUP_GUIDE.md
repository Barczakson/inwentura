# Kompletny przewodnik konfiguracji Google Sheets dla aplikacji Inwentura

## 📋 Wymagania wstępne

Aplikacja Inwentura używa Google Sheets API v4 z uwierzytelnianiem przez Service Account. To jest najbezpieczniejsza i najbardziej niezawodna metoda integracji.

## 🔧 Krok 1: Konfiguracja Google Cloud Project

### 1.1 Utwórz projekt w Google Cloud Console
1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Kliknij "Select a project" → "New Project"
3. Nazwij projekt np. "Inwentura App" i kliknij "Create"

### 1.2 Włącz Google Sheets API
1. W menu nawigacyjnym wybierz "APIs & Services" → "Library"
2. Wyszukaj "Google Sheets API"
3. Kliknij "Enable" (lub "Enable API")

### 1.3 Utwórz Service Account
1. Przejdź do "APIs & Services" → "Credentials"
2. Kliknij "Create Credentials" → "Service account"
3. Wypełnij dane:
   - **Service account name**: `inwentura-app`
   - **Service account ID**: zostaw domyślne
   - **Description**: `Service account for Inwentura app`
4. Kliknij "Create and continue"

### 1.4 Przyznaj uprawnienia
1. W sekcji "Grant this service account access to project" wybierz rolę:
   - **Role**: `Project` → `Editor`
2. Kliknij "Continue"
3. Pomiń krok "Grant users access to this service account" (kliknij "Done")

### 1.5 Wygeneruj klucz JSON
1. W liście Service Accounts znajdź `inwentura-app`
2. Kliknij na nie, a następnie przejdź do zakładki "Keys"
3. Kliknij "Add Key" → "Create new key"
4. Wybierz **JSON** i kliknij "Create"
5. Plik klucza zostanie automatycznie pobrany. **Przechowuj go bezpiecznie!**

## 📄 Krok 2: Konfiguracja Google Sheets

### 2.1 Utwórz arkusz kalkulacyjny
1. Przejdź do [Google Sheets](https://sheets.google.com)
2. Utwórz nowy arkusz o nazwie "Inwentura Produkty"
3. Skonfiguruj strukturę arkusza:

**Arkusz "Produkty" (musi mieć dokładnie tę nazwę):**
```
| A          | B          | C           | D            | E              |
|------------|------------|-------------|--------------|----------------|
| ID         | Nazwa      | Kategoria   | Jednostka    | Częstotliwość  |
|------------|------------|-------------|--------------|----------------|
| product_1  | Jabłko     | Owoce       | szt          | 10             |
| product_2  | Mleko      | Nabiał      | l            | 15             |
| ...        | ...        | ...         | ...          | ...            |
```

### 2.2 Udostępnij arkusz Service Account
1. Skopiuj email Service Account z pliku JSON (pole `client_email`)
2. W Google Sheets kliknij "Share" 
3. Wklej email Service Account
4. Nadaj uprawnienia **Editor**
5. Kliknij "Send"

### 2.3 Skopiuj ID arkusza
1. Z URL arkusza skopiuj ID:
   ```
   https://docs.google.com/spreadsheets/d/[TUTAJ_ID]/edit
   ```
2. ID to ciąg znaków między `/d/` a `/edit`

## 🔑 Krok 3: Konfiguracja zmiennych środowiskowych

### 3.1 Przygotuj dane z pliku JSON
Otwórz pobrany plik JSON i skopiuj:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY`
- ID arkusza → `GOOGLE_SHEETS_ID`

### 3.2 Zaktualizuj plik .env
W głównym katalogu projektu edytuj plik `.env`:

```env
# Database
DATABASE_URL=file:/home/z/my-project/db/custom.db

# Google Sheets Configuration
GOOGLE_SHEETS_ID="twój_id_arkusza_tutaj"
GOOGLE_SERVICE_ACCOUNT_EMAIL="twój_service_account_email@projekt.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTWOJ_KLICZ_PRYWATNY_TUTAJ\n-----END PRIVATE KEY-----\n"

# App Password Protection
INWENTURA_PASSWORD="twoje_hasło"
```

**WAŻNE:** Dla `GOOGLE_PRIVATE_KEY`:
- Zachowaj format `-----BEGIN PRIVATE KEY-----\n... \n-----END PRIVATE KEY-----\n`
- Upewnij się, że `\n` reprezentuje prawdziwe znaki nowej linii
- W pliku .env użyj cudzysłowów i zachowaj dokładny format

### 3.3 Przykład poprawnego formatu klucza:
```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKB\n...\n-----END PRIVATE KEY-----\n"
```

## 🚀 Krok 4: Testowanie konfiguracji

### 4.1 Sprawdź połączenie
Uruchom aplikację i sprawdź w konsoli przeglądarki:
```javascript
// Otwórz dev tools (F12) i wpisz:
console.log('Google Sheets configured:', isGoogleSheetsConfigured());
```

### 4.2 Test API
Aby przetestować połączenie, możesz użyć endpointu testowego:
```bash
curl -X GET http://localhost:3000/api/inwentura/products/search?query=jabłko
```

### 4.3 Sprawdź logi
W logach aplikacji poszukaj komunikatów o połączeniu z Google Sheets.

## 🔍 Krok 5: Debugowanie problemów

### 5.1 Common errors and solutions:

**Error: "Failed to get access token"**
- Sprawdź format klucza prywatnego w .env
- Upewnij się, że Service Account ma uprawnienia do projektu
- Sprawdź, czy Google Sheets API jest włączone

**Error: "Google Sheets API error: 403 Forbidden"**
- Sprawdź, czy Service Account ma dostęp do arkusza
- Upewnij się, że arkusz jest udostępniony z uprawnieniami Editor
- Sprawdź poprawność ID arkusza

**Error: "Google Sheets API error: 404 Not Found"**
- Sprawdź poprawność ID arkusza
- Upewnij się, że arkusz istnieje i ma nazwę "Produkty"
- Sprawdź strukturę arkusza (nagłówki w pierwszym wierszu)

### 5.2 Testowanie ręczne:
Możesz przetestować API bezpośrednio:
```javascript
// W konsoli przeglądarki:
(async () => {
  try {
    const products = await googleSheetsService.fetchProducts();
    console.log('Products:', products);
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

## 📊 Krok 6: Struktura danych w Google Sheets

### 6.1 Wymagana struktura arkusza "Produkty":
- **Kolumna A**: ID (unikalny identyfikator produktu)
- **Kolumna B**: Nazwa (nazwa produktu)
- **Kolumna C**: Kategoria (kategoria produktu)
- **Kolumna D**: Jednostka (domyślna jednostka: szt, kg, g, l, ml)
- **Kolumna E**: Częstotliwość (liczba użycia, aktualizowana automatycznie)

### 6.2 Przykładowe dane:
```
ID,Nazwa,Kategoria,Jednostka,Częstotliwość
product_1,Jabłko,Owoce,szt,10
product_2,Mleko,Nabiał,l,15
product_3,Chleb,Pieczywo,szt,12
product_4,Cukier,Przyprawy,kg,5
```

## 🔄 Krok 7: Automatyzacja i zarządzanie

### 7.1 Czyszczenie cache
Aplikacja cache'uje produkty na 24 godziny. Aby wymusić odświeżenie:
1. W aplikacji kliknij przycisk odświeżania 🔄
2. Lub wyczyść localStorage: `localStorage.removeItem('products_cache')`

### 7.2 Monitorowanie użycia
Aplikacja automatycznie aktualizuje częstotliwość użycia produktów w kolumnie E.

## 🛡️ Krok 8: Bezpieczeństwo

### 8.1 Best practices:
- **Nigdy nie udostępniaj** pliku JSON z kluczem prywatnym
- **Nigdy nie commituj** pliku .env do repozytorium
- **Używaj środowisk** development/production z różnymi kluczami
- **Regularnie rotuj** klucze Service Account

### 8.2 Ograniczenia API:
Google Sheets API ma limity:
- 100 żądań na 100 sekund
- 500 żądań na dzień (dla darmowego konta)
- Aplikacja cache'uje dane, aby zminimalizować żądania

## 🎯 Krok 9: Zaawansowana konfiguracja (opcjonalnie)

### 9.1 Wiele arkuszy
Możesz użyć wielu arkuszy, zmieniając nazwę w kodzie:
```typescript
// W googleSheets.ts zmień:
const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetsId}/values/Produkty`;
// na:
const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetsId}/values/Twoja_Nazwa_Arkusza`;
```

### 9.2 Wiele użytkowników
Aplikacja wspiera konfigurację per użytkownik. Możesz skonfigurować różne arkusze dla różnych użytkowników.

---

## ✅ Checklist przed wdrożeniem

- [ ] Utworzono projekt w Google Cloud Console
- [ ] Włączono Google Sheets API
- [ ] Utworzono Service Account z rolą Editor
- [ ] Pobrano klucz JSON
- [ ] Utworzono arkusz z nazwą "Produkty"
- [ ] Udostępniono arkusz Service Account
- [ ] Skonfigurowano zmienne środowiskowe
- [ ] Przetestowano połączenie
- [ ] Sprawdzono logi błędów

---

## 📞 Pomoc i wsparcie

Jeśli napotkasz problemy:
1. Sprawdź logi w konsoli przeglądarki
2. Sprawdź logi serwera (`dev.log`)
3. Upewnij się, że wszystkie kroki konfiguracji zostały wykonane poprawnie
4. Sprawdź uprawnienia Service Account w Google Cloud Console

Gotowe! Po wykonaniu tych kroków Twoja aplikacja Inwentura będzie w pełni zintegrowana z Google Sheets.