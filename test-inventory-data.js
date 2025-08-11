// Testowe dane inwentarza do przetestowania funkcjonalności eksportu CSV
const testInventoryData = [
  {
    id: "test-1",
    productId: "11447",
    product: {
      id: "11447",
      name: "p. BESZAMEL SZPARAGOWY 1kg",
      category: "PÓŁPRODUKTY",
      defaultUnit: "kg"
    },
    weight: 2.5,
    unit: "kg",
    timestamp: new Date().toISOString(),
    userId: "demo-user"
  },
  {
    id: "test-2",
    productId: "2899",
    product: {
      id: "2899",
      name: "p. BOROWIK MARYNOWANY słoik 1kg",
      category: "PÓŁPRODUKTY",
      defaultUnit: "kg"
    },
    weight: 1.0,
    unit: "kg",
    timestamp: new Date().toISOString(),
    userId: "demo-user"
  },
  {
    id: "test-3",
    productId: "20014",
    product: {
      id: "20014",
      name: "Andruty",
      category: "PRODUKCJA",
      defaultUnit: "kg"
    },
    weight: 0.5,
    unit: "kg",
    timestamp: new Date().toISOString(),
    userId: "demo-user"
  },
  {
    id: "test-4",
    productId: "20016",
    product: {
      id: "20016",
      name: "Baileys",
      category: "PRODUKCJA",
      defaultUnit: "l"
    },
    weight: 0.7,
    unit: "l",
    timestamp: new Date().toISOString(),
    userId: "demo-user"
  },
  {
    id: "test-5",
    productId: "1296",
    product: {
      id: "1296",
      name: "alkohol wino kuchnia",
      category: "SUROWCE",
      defaultUnit: "l"
    },
    weight: 1.5,
    unit: "l",
    timestamp: new Date().toISOString(),
    userId: "demo-user"
  },
  {
    id: "test-6",
    productId: "117",
    product: {
      id: "117",
      name: "nabiał jajka",
      category: "SUROWCE",
      defaultUnit: "szt"
    },
    weight: 12,
    unit: "szt",
    timestamp: new Date().toISOString(),
    userId: "demo-user"
  }
];

// Zapisz dane do localStorage
localStorage.setItem('inwentura_inventory', JSON.stringify(testInventoryData));
localStorage.setItem('inwentura_auth', 'authenticated');

console.log('Testowe dane inwentarza zostały dodane do localStorage');
console.log('Odśwież stronę, żeby zobaczyć dane');
