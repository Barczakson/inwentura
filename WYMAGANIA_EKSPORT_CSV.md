# Wymagania dla eksportu CSV i funkcjonalności inwentarza

## Problem do naprawy:
1. **ID produktu pokazuje się jako NaN** - nie pobiera poprawnie ID z danych produktu
2. **Format CSV niepoprawny** - brakuje przecinków, nieprawidłowe nagłówki kategorii
3. **Brak agregacji powtarzających się produktów** - każde dodanie tworzy nową pozycję
4. **Brak pytania o dodanie do istniejącej pozycji**

## Wymagany format CSV:
```
L.p.,Nr indeksu,Nazwa towaru,JMZ
PRODUKCJA,,,,
1,20014,Andruty,kg
2,20016,Baileys,l
PÓŁPRODUKTY,,,,
3,11447,p. BESZAMEL SZPARAGOWY 1kg,kg
4,2899,p. BOROWIK MARYNOWANY słoik 1kg,kg
SUROWCE,,,,
5,1296,alkohol wino kuchnia,l
6,117,nabiał jajka,szt
```

## Wymagana funkcjonalność agregacji:
- Gdy użytkownik wprowadza produkt który już istnieje w inwentarzu
- System pyta: "Produkt już istnieje. Czy dodać do istniejącej pozycji?"
- Jeśli TAK - sumuje ilości
- Jeśli NIE - tworzy nową pozycję

## Przykład:
1. Wprowadzam: udziec wołowy 1 kg
2. Wprowadzam ponownie: udziec wołowy 1 kg  
3. System pyta o dodanie do istniejącej pozycji
4. Po potwierdzeniu: udziec wołowy 2 kg (suma)

## Format inwentarza:
- Główne elementy: nazwa, jednostka, ilość
- Możliwość wyświetlania dodatkowych informacji
- Zachowanie czytelności i funkcjonalności
