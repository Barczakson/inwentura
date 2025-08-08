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
  // Search products with fuzzy matching
  static async searchProducts(query: string, limit: number = 10): Promise<ProductSuggestion[]> {
    if (!query.trim()) return [];
    
    try {
      console.log('Searching for products with query:', query);
      
      // First try exact match
      const exactMatches = await db.product.findMany({
        where: {
          name: {
            contains: query.toLowerCase()
          }
        },
        orderBy: [
          { frequency: 'desc' },
          { name: 'asc' }
        ],
        take: limit
      });

      console.log('Exact matches found:', exactMatches.length);

      // If we have exact matches, return them
      if (exactMatches.length > 0) {
        return exactMatches.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          defaultUnit: product.defaultUnit,
          frequency: product.frequency || 0,
          score: 100 // Exact match gets perfect score
        }));
      }

      // If no exact matches, try partial match
      const partialMatches = await db.product.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query.toLowerCase()
              }
            },
            {
              category: {
                contains: query.toLowerCase()
              }
            }
          ]
        },
        orderBy: [
          { frequency: 'desc' },
          { name: 'asc' }
        ],
        take: limit
      });

      console.log('Partial matches found:', partialMatches.length);

      return partialMatches.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        defaultUnit: product.defaultUnit,
        frequency: product.frequency || 0,
        score: this.calculateScore(query, product.name)
      }));

    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Add new product
  static async addProduct(name: string, category: string, defaultUnit: string = 'szt'): Promise<ProductSuggestion | null> {
    try {
      // Check if product already exists
      const existingProduct = await db.product.findFirst({
        where: {
          name: {
            equals: name.toLowerCase()
          }
        }
      });

      if (existingProduct) {
        return {
          id: existingProduct.id,
          name: existingProduct.name,
          category: existingProduct.category,
          defaultUnit: existingProduct.defaultUnit,
          frequency: existingProduct.frequency || 0
        };
      }

      // Create new product
      const newProduct = await db.product.create({
        data: {
          name: name.toLowerCase(),
          category: category.toLowerCase(),
          defaultUnit
        }
      });

      return {
        id: newProduct.id,
        name: newProduct.name,
        category: newProduct.category,
        defaultUnit: newProduct.defaultUnit,
        frequency: 0
      };

    } catch (error) {
      console.error('Error adding product:', error);
      return null;
    }
  }

  // Get all categories
  static async getCategories(): Promise<string[]> {
    try {
      const categories = await db.product.findMany({
        select: {
          category: true
        },
        distinct: ['category'],
        orderBy: {
          category: 'asc'
        }
      });

      return categories.map(c => c.category);

    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  // Get popular products
  static async getPopularProducts(limit: number = 20): Promise<ProductSuggestion[]> {
    try {
      const products = await db.product.findMany({
        orderBy: [
          { frequency: 'desc' },
          { name: 'asc' }
        ],
        take: limit
      });

      return products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        defaultUnit: product.defaultUnit,
        frequency: product.frequency || 0,
        score: 100
      }));

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
            increment: 1
          }
        }
      });
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
        { name: 'ryż', category: 'inne', defaultUnit: 'kg' }
      ];

      for (const product of sampleProducts) {
        const existing = await db.product.findFirst({
          where: {
            name: {
              equals: product.name.toLowerCase()
            }
          }
        });

        if (!existing) {
          await db.product.create({
            data: product
          });
        }
      }

      console.log('Sample products initialized successfully');

    } catch (error) {
      console.error('Error initializing sample products:', error);
    }
  }
}