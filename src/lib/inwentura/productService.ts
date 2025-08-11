import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export interface ProductSuggestion {
  id: number;
  name: string;
  category: string;
  defaultUnit: string;
  frequency?: number;
  score?: number;
}

export class ProductService {
  // Simple in-memory caches with TTL
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private static searchCache = new Map<string, { data: ProductSuggestion[]; ts: number }>();
  private static categoriesCache: { data: string[]; ts: number } | null = null;
  private static popularCache = new Map<number, { data: ProductSuggestion[]; ts: number }>();

  // Advanced search with intelligent matching and scoring
  static async searchProducts(query: string, limit: number = 10): Promise<ProductSuggestion[]> {
    if (!query.trim()) return [];

    const key = query.trim().toLowerCase();
    const now = Date.now();
    const cached = this.searchCache.get(key);
    if (cached && now - cached.ts < this.CACHE_TTL_MS) {
      return cached.data.slice(0, limit);
    }

    try {
      console.log('Searching for products with query:', query);

      // Get broader set of potential matches for intelligent scoring
      const allMatches = await db.product.findMany({
        where: {
          OR: [
            // Exact name match (highest priority)
            {
              name: {
                equals: query,
                mode: 'insensitive',
              },
            },
            // Name starts with query
            {
              name: {
                startsWith: query,
                mode: 'insensitive',
              },
            },
            // Name contains query
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            // Category matches
            {
              category: {
                contains: query,
                mode: 'insensitive',
              },
            },
            // Fuzzy matching for typos (split words)
            ...this.generateFuzzyQueries(query),
          ],
        },
        take: limit * 3, // Get more results for better scoring
      });

      console.log('Total matches found:', allMatches.length);

      // Score and sort results intelligently
      const scoredResults = allMatches
        .map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          defaultUnit: product.defaultUnit,
          frequency: product.frequency || 0,
          score: this.calculateAdvancedScore(query, product),
          matchType: this.getMatchType(query, product),
        }))
        .filter((result) => result.score > 0) // Remove irrelevant results
        .sort((a, b) => {
          // Sort by score first, then frequency, then alphabetically
          if (b.score !== a.score) return b.score - a.score;
          if (b.frequency !== a.frequency) return b.frequency - a.frequency;
          return a.name.localeCompare(b.name);
        })
        .slice(0, limit);

      this.searchCache.set(key, { data: scoredResults, ts: now });
      return scoredResults;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error; // Re-throw for fallback handling
    }
  }

  // Add new product
  static async addProduct(name: string, category: string, defaultUnit: string = 'szt'): Promise<ProductSuggestion | null> {
    try {
      // Check if product already exists (case-insensitive)
      const existingProduct = await db.product.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      });

      if (existingProduct) {
        return {
          id: existingProduct.id,
          name: existingProduct.name,
          category: existingProduct.category,
          defaultUnit: existingProduct.defaultUnit,
          frequency: existingProduct.frequency || 0,
        };
      }

      // Create new product (preserve original case)
      const newProduct = await db.product.create({
        data: {
          name: name.trim(),
          category: category.trim(),
          defaultUnit,
        },
      });

      // Invalidate caches impacted by write
      this.categoriesCache = null;
      this.popularCache.clear();
      this.searchCache.delete(name.trim().toLowerCase());

      return {
        id: newProduct.id,
        name: newProduct.name,
        category: newProduct.category,
        defaultUnit: newProduct.defaultUnit,
        frequency: 0,
      };
    } catch (error) {
      console.error('Error adding product:', error);
      return null;
    }
  }

  // Get all categories (with caching)
  static async getCategories(): Promise<string[]> {
    const now = Date.now();
    if (this.categoriesCache && now - this.categoriesCache.ts < this.CACHE_TTL_MS) {
      return this.categoriesCache.data;
    }

    try {
      const categories = await db.product.findMany({
        select: {
          category: true,
        },
        distinct: ['category'],
        orderBy: {
          category: 'asc',
        },
      });

      const data = categories.map((c) => c.category);
      this.categoriesCache = { data, ts: now };
      return data;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error; // Re-throw for fallback handling
    }
  }

  // Get popular products (with caching per limit)
  static async getPopularProducts(limit: number = 20): Promise<ProductSuggestion[]> {
    const now = Date.now();
    const cached = this.popularCache.get(limit);
    if (cached && now - cached.ts < this.CACHE_TTL_MS) {
      console.log('Returning cached popular products:', cached.data.length);
      return cached.data;
    }

    try {
      const products = await db.product.findMany({
        orderBy: [
          { frequency: 'desc' },
          { name: 'asc' },
        ],
        take: limit,
      });

      const data = products.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        defaultUnit: product.defaultUnit,
        frequency: product.frequency || 0,
        score: 100,
      }));

      this.popularCache.set(limit, { data, ts: now });
      return data;
    } catch (error) {
      console.error('Error getting popular products:', error);
      throw error; // Re-throw for fallback handling
    }
  }

  // Increment product frequency (when product is used)
  static async incrementFrequency(productId: number): Promise<void> {
    try {
      await db.product.update({
        where: { id: productId },
        data: {
          frequency: {
            increment: 1,
          },
        },
      });
      // Invalidate popular cache after updates that may change ordering
      this.popularCache.clear();
    } catch (error) {
      console.error('Error incrementing frequency:', error);
    }
  }

  // Generate fuzzy search queries for typos and partial matches
  private static generateFuzzyQueries(query: string): any[] {
    const queries = [];
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // Search for individual words
    for (const word of words) {
      queries.push({
        name: {
          contains: word,
          mode: 'insensitive',
        },
      });
    }

    return queries;
  }

  // Advanced scoring algorithm with multiple factors
  private static calculateAdvancedScore(query: string, product: any): number {
    const queryLower = query.toLowerCase().trim();
    const nameLower = product.name.toLowerCase();
    const categoryLower = product.category.toLowerCase();

    let score = 0;

    // Exact name match (highest score)
    if (nameLower === queryLower) {
      score += 1000;
    }
    // Name starts with query (very high score)
    else if (nameLower.startsWith(queryLower)) {
      score += 800;
    }
    // Name contains query (high score)
    else if (nameLower.includes(queryLower)) {
      score += 600;
      // Bonus for position (earlier = better)
      const position = nameLower.indexOf(queryLower);
      score += Math.max(0, 100 - position * 2);
    }

    // Category matches (medium score)
    if (categoryLower.includes(queryLower)) {
      score += 300;
    }

    // Word-based matching for multi-word queries
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);
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

    // Frequency bonus (popular products get slight boost)
    const frequency = product.frequency || 0;
    score += Math.min(frequency * 2, 100);

    // Length penalty (shorter names are often more relevant)
    const lengthPenalty = Math.max(0, nameLower.length - queryLower.length) * 2;
    score -= lengthPenalty;

    return Math.max(0, score);
  }

  // Determine match type for UI highlighting
  private static getMatchType(query: string, product: any): string {
    const queryLower = query.toLowerCase().trim();
    const nameLower = product.name.toLowerCase();
    const categoryLower = product.category.toLowerCase();

    if (nameLower === queryLower) return 'exact';
    if (nameLower.startsWith(queryLower)) return 'prefix';
    if (nameLower.includes(queryLower)) return 'contains';
    if (categoryLower.includes(queryLower)) return 'category';
    return 'fuzzy';
  }

  // Initialize with sample products
  static async initializeSampleProducts(): Promise<void> {
    try {
      const sampleProducts = [
        { name: 'jabłko', category: 'owoce', defaultUnit: 'kg' },
        { name: 'banan', category: 'owoce', defaultUnit: 'kg' },
        { name: 'pomarańcza', category: 'owoce', defaultUnit: 'kg' },
        { name: 'marchew', category: 'warzywa', defaultUnit: 'kg' },
        { name: 'ziemniak', category: 'warzywa', defaultUnit: 'kg' },
        { name: 'cebula', category: 'warzywa', defaultUnit: 'kg' },
        { name: 'mleko', category: 'nabiał', defaultUnit: 'l' },
        { name: 'ser', category: 'nabiał', defaultUnit: 'kg' },
        { name: 'jajko', category: 'nabiał', defaultUnit: 'szt' },
        { name: 'chleb', category: 'pieczywo', defaultUnit: 'szt' },
        { name: 'bułka', category: 'pieczywo', defaultUnit: 'szt' },
        { name: 'kurczak', category: 'mięso', defaultUnit: 'kg' },
        { name: 'wieprzowina', category: 'mięso', defaultUnit: 'kg' },
        { name: 'woda', category: 'napoje', defaultUnit: 'l' },
        { name: 'kawa', category: 'napoje', defaultUnit: 'g' },
        { name: 'cukier', category: 'przyprawy', defaultUnit: 'kg' },
        { name: 'sól', category: 'przyprawy', defaultUnit: 'kg' },
        { name: 'olej', category: 'inne', defaultUnit: 'l' },
        { name: 'makaron', category: 'inne', defaultUnit: 'kg' },
        { name: 'ryż', category: 'inne', defaultUnit: 'kg' },
      ];

      for (const product of sampleProducts) {
        const existing = await db.product.findFirst({
          where: {
            name: {
              equals: product.name,
              mode: 'insensitive',
            },
          },
        });

        if (!existing) {
          await db.product.create({
            data: {
              name: product.name,
              category: product.category,
              defaultUnit: product.defaultUnit,
            },
          });
        }
      }

      console.log('Sample products initialized successfully');
    } catch (error) {
      console.error('Error initializing sample products:', error);
    }
  }
}