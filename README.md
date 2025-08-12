# 📦 Aplikacja Inwentura

Nowoczesna aplikacja do zarządzania inwentarzem z obsługą komend głosowych, inteligentnym wyszukiwaniem produktów i eksportem danych.

## 🚀 Funkcjonalności

### ✨ Główne funkcje
- **🎤 Rozpoznawanie mowy** - Dodawanie produktów za pomocą komend głosowych
- **🔍 Inteligentne wyszukiwanie** - Sugestie produktów z bazy danych Supabase (578+ produktów)
- **🔄 Agregacja produktów** - Automatyczne sumowanie powtarzających się pozycji
- **📊 Eksport danych** - CSV i JSON z wyborem nazwy pliku
- **📱 Responsywny design** - Działa na wszystkich urządzeniach
- **💾 Offline support** - Przechowywanie danych w localStorage

### 🎯 Nowy układ formularza
```
┌─────────────────────────────────────┐
│     [+] Dodaj do inwentarza         │ ← Przycisk na górze
└─────────────────────────────────────┘

┌─────────────────┬───────────────────┐
│ Waga/Ilość      │ Jednostka         │ ← Pola w środku
│ [1]             │ [kg ▼]            │
└─────────────────┴───────────────────┘

┌─────────────────────────────────────┐
│ Produkt                             │ ← Pole z sugestiami na dole
│ [input z listą sugestii]            │
└─────────────────────────────────────┘
```

## 🛠️ Technologie

- **Next.js 15** - React framework z App Router
- **TypeScript** - Typowanie statyczne
- **Tailwind CSS** - Stylowanie
- **shadcn/ui** - Komponenty UI
- **Supabase** - Baza danych PostgreSQL
- **Prisma** - ORM i migracje
- **React Query** - Cache'owanie danych
- **Web Speech API** - Rozpoznawanie mowy

## 🚀 Szybki start

### 1. Instalacja
```bash
git clone <repository-url>
cd inwentura-app
npm install
```

### 2. Konfiguracja
```bash
cp .env.example .env.local
# Wypełnij zmienne środowiskowe Supabase
```

### 3. Uruchomienie
```bash
npm run dev
# Aplikacja dostępna na http://localhost:3000
```

## 📖 Instrukcja użytkowania

### 🎤 Dodawanie produktów głosowo
1. Kliknij "Nagraj komendę głosową"
2. Powiedz np.: "jabłko dwa kilogramy"
3. Aplikacja wypełni formularz automatycznie
4. Kliknij "Dodaj do inwentarza"

### ✋ Dodawanie produktów ręcznie
1. Kliknij "Dodaj do inwentarza" (przycisk na górze)
2. Wprowadź wagę/ilość i jednostkę
3. Wpisz nazwę produktu (pojawią się sugestie)
4. Wybierz produkt z listy

### 🔄 Agregacja produktów
Gdy dodajesz produkt który już istnieje:
- Aplikacja zapyta: "Dodać do istniejącej pozycji?"
- **TAK** → ilości zostaną zsumowane
- **NIE** → utworzona zostanie nowa pozycja

### 📤 Eksport danych
- **CSV** - Format z kategoriami, ID i ilościami
- **JSON** - Pełne dane z timestampami
- **Wybór nazwy pliku** - Aplikacja pyta o nazwę przed pobraniem

## 📊 Format eksportu CSV

```csv
L.p.,Nr indeksu,Nazwa towaru,Ilość,JMZ
PRODUKCJA,,,,
1,20014,Andruty,0.5,kg
2,20016,Baileys,0.7,l
PÓŁPRODUKTY,,,,
3,11447,p. BESZAMEL SZPARAGOWY 1kg,2.5,kg
SUROWCE,,,,
4,398,owoce jabłka,2,kg
5,234,warzywa marchew,0.4,kg
```

## 🔧 API Endpoints

### Produkty
- `GET /api/inwentura/products/search?q={query}` - Wyszukiwanie
- `GET /api/inwentura/products/popular?limit={n}` - Popularne
- `GET /api/inwentura/products/categories` - Kategorie
- `GET /api/inwentura/products/all` - Wszystkie produkty

### Inwentarz
- `GET /api/inwentura/items/list?user={userId}` - Lista pozycji
- `POST /api/inwentura/items/add` - Dodanie pozycji
- `DELETE /api/inwentura/items/{id}` - Usunięcie pozycji

## 📱 Responsywność

### 📱 Telefony (< 640px)
- Przyciski w siatce 2x2
- Formularz pionowy
- Pełne nazwy przycisków

### 📟 Tablety (640px - 1024px)
- Przyciski w linii poziomej
- Mieszany układ formularza
- Optymalne wykorzystanie przestrzeni

### 🖥️ Desktopy (> 1024px)
- Pełny poziomy układ
- Maksymalna efektywność
- Wszystkie funkcje widoczne

## 🔍 Funkcje wyszukiwania

### Inteligentne dopasowanie
- **Dokładne**: "jabłko" → "jabłko"
- **Częściowe**: "jabł" → "owoce jabłka"
- **Kategorialne**: "owoce" → wszystkie produkty z kategorii

### Cache'owanie
- **Wyniki wyszukiwania**: 1 minuta
- **Popularne produkty**: 5 minut
- **Kategorie**: 10 minut

## 🐛 Rozwiązywanie problemów

### Brak rozpoznawania mowy
- Sprawdź obsługę Web Speech API w przeglądarce
- Upewnij się o połączeniu internetowym
- Sprawdź uprawnienia mikrofonu

### Problemy z bazą danych
- Sprawdź zmienne środowiskowe w `.env.local`
- Uruchom migracje: `npx prisma migrate dev`
- Sprawdź połączenie z Supabase

### Problemy z wydajnością
- Wyczyść cache przeglądarki
- Sprawdź Network tab w DevTools
- Zrestartuj serwer: `npm run dev`

## 📁 Struktura projektu

```
src/
├── app/api/inwentura/     # API endpoints
├── components/inwentura/  # Komponenty React
├── lib/inwentura/         # Logika biznesowa
└── types/                 # Definicje TypeScript
```

## 📝 Najnowsze zmiany

### v1.0.0 (2024-01-12)
- ✅ **Nowy układ formularza** - przycisk "Dodaj" na górze
- ✅ **Wybór nazwy pliku** przy eksporcie CSV/JSON
- ✅ **Naprawiona responsywność** - lista sugestii nie zasłania przycisku
- ✅ **Usunięto przycisk "Testuj parser"** - czystszy interfejs
- ✅ **Poprawione ID produktów** - prawdziwe ID z bazy Supabase
- ✅ **Agregacja produktów** - automatyczne sumowanie duplikatów

## 🤝 Wkład w projekt

1. Fork repozytorium
2. Utwórz branch: `git checkout -b feature/nazwa-funkcji`
3. Commit zmian: `git commit -m 'Dodaj nową funkcję'`
4. Push do branch: `git push origin feature/nazwa-funkcji`
5. Utwórz Pull Request

## 📄 Licencja

MIT License

## 👥 Autorzy

- **Główny deweloper** - Implementacja i design
- **Augment Agent** - AI Assistant dla rozwoju

---

**Aplikacja Inwentura** - Nowoczesne zarządzanie inwentarzem z AI 🚀

📖 **[Pełna dokumentacja](DOKUMENTACJA_APLIKACJI.md)** | 🐛 **[Rozwiązywanie problemów](DOKUMENTACJA_APLIKACJI.md#-rozwiązywanie-problemów)**
