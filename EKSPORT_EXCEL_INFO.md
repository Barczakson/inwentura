# 📊 Eksport do Excel (XLSX) - Nowa funkcjonalność

## ✅ Zmiana z CSV na Excel

Aplikacja Inwentura teraz eksportuje dane do formatu **Excel (XLSX)** zamiast CSV, co zapewnia:

### 🎯 **Zalety formatu Excel:**
- **Lepsze formatowanie** - kolumny mają odpowiednie szerokości
- **Pogrubione nagłówki kategorii** - łatwiejsze rozróżnienie sekcji
- **Profesjonalny wygląd** - gotowy do druku i prezentacji
- **Kompatybilność** - otwiera się w Excel, LibreOffice, Google Sheets
- **Zachowane typy danych** - liczby jako liczby, tekst jako tekst

### 📋 **Format eksportu Excel:**

```
┌─────────┬─────────────┬──────────────────────────┬─────────┬─────────┐
│  L.p.   │ Nr indeksu  │      Nazwa towaru        │ Ilość   │  JMZ    │
├─────────┼─────────────┼──────────────────────────┼─────────┼─────────┤
│ PRODUKCJA                                                            │ ← Pogrubione
├─────────┼─────────────┼──────────────────────────┼─────────┼─────────┤
│    1    │    20014    │        Andruty           │   0.5   │   kg    │
│    2    │    20016    │        Baileys           │   0.7   │    l    │
├─────────┼─────────────┼──────────────────────────┼─────────┼─────────┤
│ PÓŁPRODUKTY                                                          │ ← Pogrubione
├─────────┼─────────────┼──────────────────────────┼─────────┼─────────┤
│    3    │    11447    │ p. BESZAMEL SZPARAGOWY   │   2.5   │   kg    │
├─────────┼─────────────┼──────────────────────────┼─────────┼─────────┤
│ SUROWCE                                                              │ ← Pogrubione
├─────────┼─────────────┼──────────────────────────┼─────────┼─────────┤
│    4    │     398     │     owoce jabłka         │    2    │   kg    │
│    5    │     234     │    warzywa marchew       │   0.4   │   kg    │
└─────────┴─────────────┴──────────────────────────┴─────────┴─────────┘
```

### 🔧 **Implementacja techniczna:**

#### Dodane biblioteki:
```bash
npm install xlsx @types/xlsx
```

#### Nowa funkcja exportToExcel():
```typescript
const exportToExcel = () => {
  // 1. Pytanie o nazwę pliku
  const fileName = window.prompt('Podaj nazwę pliku (bez rozszerzenia .xlsx):', defaultFileName);
  
  // 2. Grupowanie produktów według kategorii
  const productsByCategory = new Map();
  
  // 3. Przygotowanie danych dla Excel
  const excelData = [
    ['L.p.', 'Nr indeksu', 'Nazwa towaru', 'Ilość', 'JMZ'], // Nagłówek
    // ... dane produktów z kategoriami
  ];
  
  // 4. Utworzenie arkusza Excel
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  
  // 5. Ustawienie szerokości kolumn
  worksheet['!cols'] = [
    { wch: 6 },   // L.p.
    { wch: 12 },  // Nr indeksu  
    { wch: 30 },  // Nazwa towaru
    { wch: 8 },   // Ilość
    { wch: 8 }    // JMZ
  ];
  
  // 6. Stylowanie nagłówków kategorii (pogrubienie)
  // 7. Zapis i pobranie pliku
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
```

### 🎨 **Zmiany w interfejsie:**

#### Przycisk Excel:
```jsx
<Button onClick={exportToExcel} variant="outline" size="sm">
  <FileSpreadsheet className="h-4 w-4 mr-2" />
  <span className="hidden sm:inline">Excel</span>
  <span className="sm:hidden">Eksport Excel</span>
</Button>
```

#### Ikona FileSpreadsheet:
- Zastąpiono ikonę `Download` na `FileSpreadsheet`
- Lepsze rozpoznanie funkcji eksportu Excel

### 📱 **Responsywność:**
- **Desktop**: "Excel"
- **Mobile**: "Eksport Excel"
- Ikona arkusza kalkulacyjnego na wszystkich urządzeniach

### 🧪 **Jak przetestować:**

1. **Dodaj produkty do inwentarza:**
   - Użyj komend głosowych: "jabłko dwa kilogramy"
   - Lub dodaj ręcznie różne produkty z różnych kategorii

2. **Eksportuj do Excel:**
   - Kliknij przycisk "Excel" w nagłówku
   - Wprowadź nazwę pliku (np. "inwentura_test")
   - Plik `inwentura_test.xlsx` zostanie pobrany

3. **Otwórz plik Excel:**
   - W Microsoft Excel, LibreOffice Calc lub Google Sheets
   - Sprawdź formatowanie i szerokości kolumn
   - Zwróć uwagę na pogrubione nagłówki kategorii

### 📊 **Przykład zawartości pliku Excel:**

| L.p. | Nr indeksu | Nazwa towaru | Ilość | JMZ |
|------|------------|--------------|-------|-----|
| **PRODUKCJA** |  |  |  |  |
| 1 | 20014 | Andruty | 0.5 | kg |
| 2 | 20016 | Baileys | 0.7 | l |
| **PÓŁPRODUKTY** |  |  |  |  |
| 3 | 11447 | p. BESZAMEL SZPARAGOWY 1kg | 2.5 | kg |
| **SUROWCE** |  |  |  |  |
| 4 | 398 | owoce jabłka | 2 | kg |
| 5 | 234 | warzywa marchew | 0.4 | kg |

### 🔄 **Zachowane funkcjonalności:**
- ✅ Agregacja produktów według kategorii
- ✅ Sortowanie alfabetyczne kategorii i produktów
- ✅ Prawdziwe ID produktów z bazy Supabase
- ✅ Sumowanie ilości dla duplikatów
- ✅ Wybór nazwy pliku przez użytkownika
- ✅ Możliwość anulowania eksportu

### 🎯 **Korzyści dla użytkownika:**
- **Profesjonalny wygląd** - gotowy do prezentacji
- **Łatwiejsza edycja** - w Excel można dodawać formuły
- **Lepsze drukowanie** - automatyczne dopasowanie kolumn
- **Kompatybilność** - otwiera się w każdym programie biurowym

---

**Eksport Excel jest teraz aktywny!** 📊✨

Aplikacja automatycznie generuje profesjonalnie sformatowane pliki Excel z pogrubionym nagłówkami kategorii i odpowiednimi szerokościami kolumn.
