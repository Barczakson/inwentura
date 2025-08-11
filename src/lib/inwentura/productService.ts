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
  id: string;
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

  // Search products with fuzzy matching (with caching)
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

      // First try exact/contains match (case-insensitive)
      const exactMatches = await db.product.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: [
          { frequency: 'desc' },
          { name: 'asc' },
        ],
        take: limit,
      });

      console.log('Exact matches found:', exactMatches.length);

      // If we have exact matches, return them
      if (exactMatches.length > 0) {
        const result = exactMatches.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          defaultUnit: product.defaultUnit,
          frequency: product.frequency || 0,
          score: 100, // Exact/contains match gets high score
        }));
        this.searchCache.set(key, { data: result, ts: now });
        return result;
      }

      // If no exact matches, try partial match across name and category (case-insensitive)
      const partialMatches = await db.product.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              category: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: [
          { frequency: 'desc' },
          { name: 'asc' },
        ],
        take: limit,
      });

      console.log('Partial matches found:', partialMatches.length);

      const result = partialMatches.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        defaultUnit: product.defaultUnit,
        frequency: product.frequency || 0,
        score: this.calculateScore(query, product.name),
      }));
      this.searchCache.set(key, { data: result, ts: now });
      return result;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
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

      // Create new product (store normalized to lowercase for consistency)
      const newProduct = await db.product.create({
        data: {
          name: name.toLowerCase(),
          category: category.toLowerCase(),
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
      return [];
    }
  }

  // Get popular products (with caching per limit)
  static async getPopularProducts(limit: number = 20): Promise<ProductSuggestion[]> {
    const now = Date.now();
    const cached = this.popularCache.get(limit);
    if (cached && now - cached.ts < this.CACHE_TTL_MS) {
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
      return [];
    }
  }

  // Increment product frequency (when product is used)
  static async incrementFrequency(productId: string): Promise<void> {
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

  // Simple scoring algorithm for fuzzy matching
  private static calculateScore(query: string, productName: string): number {
    const queryLower = query.toLowerCase();
    const nameLower = productName.toLowerCase();

    // Exact match
    if (nameLower === queryLower) return 100;

    // Starts with
    if (nameLower.startsWith(queryLower)) return 90;

    // Contains
    if (nameLower.includes(queryLower)) return 70;

    // Partial match (character by character)
    let score = 0;
    let queryIndex = 0;

    for (let i = 0; i < nameLower.length && queryIndex < queryLower.length; i++) {
      if (nameLower[i] === queryLower[queryIndex]) {
        score += 10;
        queryIndex++;
      }
    }

    return Math.min(score, 60);
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
              equals: product.name.toLowerCase(),
            },
          },
        });

        if (!existing) {
          await db.product.create({
            data: {
              name: product.name.toLowerCase(),
              category: product.category.toLowerCase(),
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