// Mock service for testing without database connection
export interface ProductSuggestion {
  id: number;
  name: string;
  category: string;
  defaultUnit: string;
  frequency?: number;
  score?: number;
  matchType?: string;
}

const mockProducts: ProductSuggestion[] = [
  { id: 1, name: 'Jabłko', category: 'Owoce', defaultUnit: 'kg', frequency: 10 },
  { id: 2, name: 'Mleko', category: 'Nabiał', defaultUnit: 'l', frequency: 15 },
  { id: 3, name: 'p. BESZAMEL SZPARAGOWY 1kg', category: 'PÓŁPRODUKTY', defaultUnit: 'kg', frequency: 2899 },
  { id: 4, name: 'p. BOROWIK MARYNOWANY słoik 1kg', category: 'PÓŁPRODUKTY', defaultUnit: 'kg', frequency: 2238 },
  { id: 5, name: 'p. BRZOSKWINIE W CUKRZE słoik 1kg', category: 'PÓŁPRODUKTY', defaultUnit: 'kg', frequency: 1911 },
  { id: 6, name: 'p. CZEREŚNIE W WINIE 1kg', category: 'PÓŁPRODUKTY', defaultUnit: 'kg', frequency: 11216 },
  { id: 7, name: 'p. DEMI GLACE Z KURCZAKA 1kg', category: 'PÓŁPRODUKTY', defaultUnit: 'kg', frequency: 13926 },
  { id: 8, name: 'p. DEMI RAKI 1kg', category: 'PÓŁPRODUKTY', defaultUnit: 'kg', frequency: 1925 },
  { id: 9, name: 'p. DEMI RAKI, SKRZYDEŁKA 1kg', category: 'PÓŁPRODUKTY', defaultUnit: 'kg', frequency: 12826 },
  { id: 10, name: 'p. ESPUMA CZARNY BEZ 1kg', category: 'PÓŁPRODUKTY', defaultUnit: 'kg', frequency: 0 },
  { id: 11, name: 'Chleb', category: 'Pieczywo', defaultUnit: 'szt', frequency: 25 },
  { id: 12, name: 'Masło', category: 'Nabiał', defaultUnit: 'kg', frequency: 18 },
  { id: 13, name: 'Pomidor', category: 'Warzywa', defaultUnit: 'kg', frequency: 22 },
  { id: 14, name: 'Kurczak', category: 'Mięso', defaultUnit: 'kg', frequency: 30 },
  { id: 15, name: 'Ryż', category: 'Inne', defaultUnit: 'kg', frequency: 12 },
];

export class MockProductService {
  static async searchProducts(query: string, limit: number = 10): Promise<ProductSuggestion[]> {
    if (!query.trim()) return [];

    const queryLower = query.toLowerCase().trim();
    
    // Score and filter products
    const scoredResults = mockProducts
      .map((product) => ({
        ...product,
        score: this.calculateAdvancedScore(queryLower, product),
        matchType: this.getMatchType(queryLower, product),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.frequency !== a.frequency) return (b.frequency || 0) - (a.frequency || 0);
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);

    return scoredResults;
  }

  static async getPopularProducts(limit: number = 20): Promise<ProductSuggestion[]> {
    return mockProducts
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, limit)
      .map(p => ({ ...p, score: 100 }));
  }

  static async getCategories(): Promise<string[]> {
    const categories = [...new Set(mockProducts.map(p => p.category))];
    return categories.sort();
  }

  static async addProduct(name: string, category: string, defaultUnit: string = 'szt'): Promise<ProductSuggestion | null> {
    const newProduct: ProductSuggestion = {
      id: Date.now(),
      name: name.trim(),
      category: category.trim(),
      defaultUnit,
      frequency: 0,
    };
    
    mockProducts.push(newProduct);
    return newProduct;
  }

  private static calculateAdvancedScore(query: string, product: ProductSuggestion): number {
    const nameLower = product.name.toLowerCase();
    const categoryLower = product.category.toLowerCase();
    
    let score = 0;
    
    // Exact name match
    if (nameLower === query) {
      score += 1000;
    }
    // Name starts with query
    else if (nameLower.startsWith(query)) {
      score += 800;
    }
    // Name contains query
    else if (nameLower.includes(query)) {
      score += 600;
      const position = nameLower.indexOf(query);
      score += Math.max(0, 100 - position * 2);
    }
    
    // Category matches
    if (categoryLower.includes(query)) {
      score += 300;
    }
    
    // Word-based matching
    const queryWords = query.split(/\s+/).filter(w => w.length > 1);
    const nameWords = nameLower.split(/\s+/);
    
    for (const queryWord of queryWords) {
      for (const nameWord of nameWords) {
        if (nameWord.startsWith(queryWord)) {
          score += 200;
        } else if (nameWord.includes(queryWord)) {
          score += 100;
        }
      }
    }
    
    // Frequency bonus
    const frequency = product.frequency || 0;
    score += Math.min(frequency * 2, 100);
    
    // Length penalty
    const lengthPenalty = Math.max(0, nameLower.length - query.length) * 2;
    score -= lengthPenalty;
    
    return Math.max(0, score);
  }

  private static getMatchType(query: string, product: ProductSuggestion): string {
    const nameLower = product.name.toLowerCase();
    const categoryLower = product.category.toLowerCase();
    
    if (nameLower === query) return 'exact';
    if (nameLower.startsWith(query)) return 'prefix';
    if (nameLower.includes(query)) return 'contains';
    if (categoryLower.includes(query)) return 'category';
    return 'fuzzy';
  }
}
