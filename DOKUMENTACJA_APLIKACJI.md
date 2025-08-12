# 📦 Aplikacja Inwentura - Pełna Dokumentacja

## 🎯 Opis aplikacji

Nowoczesna aplikacja do zarządzania inwentarzem z obsługą komend głosowych, inteligentnym wyszukiwaniem produktów i eksportem danych. Aplikacja umożliwia efektywne zarządzanie zapasami z wykorzystaniem najnowszych technologii web.

## ✨ Główne funkcjonalności

### 🎤 Rozpoznawanie mowy
- **Komendy głosowe**: "jabłko dwa kilogramy", "marchew pół kilograma"
- **Automatyczne parsowanie**: nazwa produktu, ilość, jednostka
- **Obsługa języka polskiego** z Web Speech API
- **Timeout 10 sekund** z wizualnym feedbackiem

### 🔍 Inteligentne wyszukiwanie produktów
- **Baza 578+ produktów** z Supabase
- **Dopasowanie wielopoziomowe**:
  - Dokładne (exact match)
  - Częściowe (contains)
  - Kategorialne (category match)
- **Cache'owanie wyników** z React Query
- **Popularne produkty** na podstawie częstotliwości użycia

### 📊 Agregacja i zarządzanie
- **Automatyczne wykrywanie duplikatów**
- **Dialog agregacji**: "Dodać do istniejącej pozycji?"
- **Sumowanie ilości** przy potwierdzeniu
- **Edycja i usuwanie** pozycji inwentarza

### 📤 Eksport danych
- **CSV z kategoriami**:
  ```csv
  L.p.,Nr indeksu,Nazwa towaru,Ilość,JMZ
  PRODUKCJA,,,,
  1,20014,Andruty,0.5,kg
  ```
- **JSON szczegółowy** z timestampami
- **Wybór nazwy pliku** przez użytkownika
- **Automatyczne pobieranie** plików

### 📱 Responsywność
- **Telefony**: Pionowy układ, pełne nazwy przycisków
- **Tablety**: Mieszany układ, optymalne wykorzystanie
- **Desktopy**: Poziomy układ, maksymalna efektywność

## 🛠️ Architektura techniczna

### Frontend Stack
```typescript
- Next.js 15 (App Router)
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui components
- React Query (TanStack)
- Framer Motion
```

### Backend Stack
```typescript
- Supabase (PostgreSQL)
- Prisma ORM
- Next.js API Routes
- Web Speech API
```

### Struktura bazy danych
```sql
-- Tabela produktów
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  defaultunit VARCHAR(20),
  frequency INTEGER DEFAULT 0
);

-- Tabela inwentarza (opcjonalna - używa localStorage)
CREATE TABLE InventoryItem (
  id VARCHAR(255) PRIMARY KEY,
  productid INTEGER REFERENCES products(id),
  weight DECIMAL,
  unit VARCHAR(20),
  timestamp TIMESTAMP,
  userid VARCHAR(255)
);
```

## 📁 Struktura projektu

```
src/
├── app/
│   ├── api/inwentura/
│   │   ├── products/
│   │   │   ├── search/route.ts      # Wyszukiwanie produktów
│   │   │   ├── popular/route.ts     # Popularne produkty
│   │   │   ├── categories/route.ts  # Lista kategorii
│   │   │   ├── all/route.ts         # Wszystkie produkty
│   │   │   └── add/route.ts         # Dodawanie produktu
│   │   └── items/
│   │       ├── list/route.ts        # Lista inwentarza
│   │       ├── add/route.ts         # Dodawanie pozycji
│   │       └── [id]/route.ts        # Usuwanie pozycji
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── inwentura/
│   │   ├── InwenturaApp.tsx         # Główny komponent
│   │   └── ProductSuggestions.tsx   # Wyszukiwanie z sugestiami
│   └── ui/                          # Komponenty shadcn/ui
├── lib/
│   ├── inwentura/
│   │   ├── productService.ts        # Serwis produktów
│   │   ├── mockProductService.ts    # Dane mock
│   │   └── voiceParser.ts           # Parser komend głosowych
│   ├── db.ts                        # Konfiguracja Prisma
│   └── utils.ts
└── types/
    └── inwentura.ts                 # Definicje TypeScript
```

## 🔧 API Endpoints

### Produkty
```typescript
GET /api/inwentura/products/search?q={query}&limit={n}
// Wyszukiwanie produktów z filtrowaniem

GET /api/inwentura/products/popular?limit={n}
// Popularne produkty według częstotliwości

GET /api/inwentura/products/categories
// Lista wszystkich kategorii

GET /api/inwentura/products/all
// Wszystkie produkty (sortowane)

POST /api/inwentura/products/add
// Dodanie nowego produktu
```

### Inwentarz
```typescript
GET /api/inwentura/items/list?user={userId}
// Lista pozycji inwentarza użytkownika

POST /api/inwentura/items/add
// Dodanie nowej pozycji

DELETE /api/inwentura/items/{id}
// Usunięcie pozycji
```

## 🎨 Komponenty UI

### InwenturaApp.tsx
**Główny komponent aplikacji**
- Zarządzanie stanem inwentarza
- Obsługa rozpoznawania mowy
- Funkcje eksportu danych
- Responsywny layout

### ProductSuggestions.tsx
**Komponent wyszukiwania produktów**
- Debounced search (200ms)
- Cache'owanie wyników
- Keyboard navigation
- Highlighting dopasowań

## 🔄 Przepływ danych

### 1. Dodawanie produktu głosowo
```
Użytkownik → Web Speech API → voiceParser → 
ProductSuggestions → handleAddItem → localStorage
```

### 2. Wyszukiwanie produktów
```
Input → debounce(200ms) → API call → 
React Query cache → ProductSuggestions
```

### 3. Eksport danych
```
Inwentarz → agregacja kategorii → 
CSV generation → prompt nazwy → download
```

## 📊 Formaty danych

### Struktura pozycji inwentarza
```typescript
interface InventoryItem {
  id: string;
  productId: string | number;
  product: {
    id: string | number;
    name: string;
    category: string;
    defaultUnit: string;
  };
  weight: number;
  unit: Unit;
  timestamp: Date;
  userId: string;
}
```

### Format eksportu CSV
```csv
L.p.,Nr indeksu,Nazwa towaru,Ilość,JMZ
KATEGORIA,,,,
1,ID,Nazwa,Ilość,Jednostka
```

### Format eksportu JSON
```json
[
  {
    "nazwa": "jabłko",
    "waga": 2,
    "jednostka": "kg",
    "data": "12.01.2024",
    "czas": "14:30",
    "timestamp": "2024-01-12T14:30:00.000Z"
  }
]
```

## 🚀 Instalacja i konfiguracja

### 1. Wymagania systemowe
- Node.js 18+
- npm/yarn/pnpm
- Konto Supabase (opcjonalne)

### 2. Instalacja
```bash
git clone <repository>
cd inwentura-app
npm install
```

### 3. Konfiguracja środowiska
```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://user:pass@host:port/db"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

### 4. Migracje bazy danych
```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Uruchomienie
```bash
npm run dev
# Aplikacja dostępna na http://localhost:3000
```

## 🧪 Testowanie

### Testowanie rozpoznawania mowy
1. Kliknij "Nagraj komendę głosową"
2. Powiedz: "jabłko dwa kilogramy"
3. Sprawdź czy formularz się wypełnił

### Testowanie wyszukiwania
1. Wpisz "udzie" w pole produktu
2. Sprawdź czy pojawiają się sugestie
3. Wybierz produkt z listy

### Testowanie agregacji
1. Dodaj "udziec wołowy 1 kg"
2. Dodaj ponownie "udziec wołowy 1 kg"
3. Sprawdź dialog agregacji

### Testowanie eksportu
1. Dodaj kilka produktów
2. Kliknij "CSV" 
3. Wprowadź nazwę pliku
4. Sprawdź pobrany plik

## 🔧 Rozwiązywanie problemów

### Brak rozpoznawania mowy
- Sprawdź obsługę Web Speech API
- Upewnij się o połączeniu internetowym
- Sprawdź uprawnienia mikrofonu

### Problemy z bazą danych
- Sprawdź zmienne środowiskowe
- Uruchom: `npx prisma migrate dev`
- Sprawdź połączenie z Supabase

### Problemy z wydajnością
- Wyczyść cache przeglądarki
- Sprawdź Network tab w DevTools
- Zrestartuj serwer: `npm run dev`

## 📈 Metryki wydajności

### Cache'owanie
- **Produkty popularne**: 5 minut
- **Wyniki wyszukiwania**: 1 minuta
- **Kategorie**: 10 minut

### Responsywność
- **Debounce search**: 200ms
- **Voice timeout**: 10 sekund
- **Auto-save**: Natychmiastowy

## 🔐 Bezpieczeństwo

### Walidacja danych
- Sanityzacja input SQL
- Walidacja TypeScript
- Rate limiting API

### Przechowywanie
- localStorage (offline)
- Supabase (online)
- Brak danych wrażliwych

## 📝 Changelog

### v1.0.0 (2024-01-12)
- ✅ Podstawowa funkcjonalność inwentarza
- ✅ Rozpoznawanie mowy polskie
- ✅ Inteligentne wyszukiwanie produktów
- ✅ Eksport CSV/JSON z wyborem nazwy
- ✅ Responsywny design
- ✅ Agregacja produktów
- ✅ Offline support
- ✅ Nowy układ formularza (przycisk na górze)

---

**Aplikacja Inwentura** - Profesjonalne zarządzanie inwentarzem z AI 🚀
