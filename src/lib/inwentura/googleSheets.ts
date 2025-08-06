import { Product } from '@/types/inwentura';
import { UserConfigService, getConfigSourceDisplayName } from './userConfig';

// Google Sheets API configuration
interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  sheetName: string;
}

// Google Sheets API response structure
interface GoogleSheetsResponse {
  values: string[][];
  range: string;
  majorDimension: string;
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
  }

  /**
   * Fetch products from Google Sheets
   * Expected sheet structure:
   * A: ID | B: Nazwa | C: Kategoria | D: Jednostka | E: Częstotliwość
   */
  async fetchProducts(): Promise<Product[]> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.sheetName}?key=${this.config.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
      }

      const data: GoogleSheetsResponse = await response.json();
      
      if (!data.values || data.values.length === 0) {
        return [];
      }

      // Skip header row and process data
      const products: Product[] = [];
      
      for (let i = 1; i < data.values.length; i++) {
        const row = data.values[i];
        
        if (row.length >= 4) {
          const product: Product = {
            id: row[0] || `product_${i}`,
            name: row[1] || '',
            category: row[2] || 'Inne',
            defaultUnit: row[3] as any || 'szt',
            frequency: parseInt(row[4]) || 0
          };
          
          // Only add if name is not empty
          if (product.name.trim()) {
            products.push(product);
          }
        }
      }

      return products;
    } catch (error) {
      console.error('Error fetching products from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Add a new product to Google Sheets
   */
  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      // Generate a simple ID
      const id = `product_${Date.now()}`;
      
      const newRow = [
        id,
        product.name,
        product.category,
        product.defaultUnit,
        product.frequency.toString()
      ];

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.sheetName}:append?valueInputOption=RAW&key=${this.config.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [newRow]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add product: ${response.status} ${response.statusText}`);
      }

      return {
        id,
        ...product
      };
    } catch (error) {
      console.error('Error adding product to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Update product frequency in Google Sheets
   */
  async updateProductFrequency(productId: string, frequency: number): Promise<void> {
    try {
      // First, find the row number for this product
      const products = await this.fetchProducts();
      const productIndex = products.findIndex(p => p.id === productId);
      
      if (productIndex === -1) {
        throw new Error('Product not found');
      }

      // Row number in Google Sheets (accounting for header row)
      const rowNum = productIndex + 2;
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.sheetName}!E${rowNum}?valueInputOption=RAW&key=${this.config.apiKey}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[frequency.toString()]]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update frequency: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating product frequency:', error);
      throw error;
    }
  }

  /**
   * Search products in Google Sheets
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const products = await this.fetchProducts();
      const normalizedQuery = query.toLowerCase().trim();
      
      return products.filter(product => 
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery)
      );
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
}

// Default configuration - you can override this with your actual Google Sheets config
const defaultConfig: GoogleSheetsConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || '',
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID || '',
  sheetName: 'Produkty'
};

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService(defaultConfig);

// Helper function to check if Google Sheets integration is configured
export function isGoogleSheetsConfigured(): boolean {
  return !!(defaultConfig.apiKey && defaultConfig.spreadsheetId);
}

// Mock products for fallback when Google Sheets is not configured
export const mockProducts: Product[] = [
  { id: '1', name: 'Jabłko', category: 'Owoce', defaultUnit: 'szt', frequency: 10 },
  { id: '2', name: 'Banan', category: 'Owoce', defaultUnit: 'szt', frequency: 8 },
  { id: '3', name: 'Mleko', category: 'Nabiał', defaultUnit: 'l', frequency: 15 },
  { id: '4', name: 'Chleb', category: 'Pieczywo', defaultUnit: 'szt', frequency: 12 },
  { id: '5', name: 'Cukier', category: 'Przyprawy', defaultUnit: 'kg', frequency: 5 },
  { id: '6', name: 'Marchew', category: 'Warzywa', defaultUnit: 'kg', frequency: 7 },
  { id: '7', name: 'Kurczak', category: 'Mięso', defaultUnit: 'kg', frequency: 9 },
  { id: '8', name: 'Woda', category: 'Napoje', defaultUnit: 'l', frequency: 20 },
  { id: '9', name: 'Jajka', category: 'Nabiał', defaultUnit: 'szt', frequency: 18 },
  { id: '10', name: 'Ryż', category: 'Inne', defaultUnit: 'kg', frequency: 6 },
  { id: '11', name: 'Pomidor', category: 'Warzywa', defaultUnit: 'kg', frequency: 11 },
  { id: '12', name: 'Ser', category: 'Nabiał', defaultUnit: 'kg', frequency: 9 },
  { id: '13', name: 'Masło', category: 'Nabiał', defaultUnit: 'kg', frequency: 13 },
  { id: '14', name: 'Cebula', category: 'Warzywa', defaultUnit: 'kg', frequency: 14 },
  { id: '15', name: 'Ziemniaki', category: 'Warzywa', defaultUnit: 'kg', frequency: 16 },
  { id: '16', name: 'Kawa', category: 'Napoje', defaultUnit: 'kg', frequency: 8 },
  { id: '17', name: 'Herbata', category: 'Napoje', defaultUnit: 'szt', frequency: 6 },
  { id: '18', name: 'Makaron', category: 'Inne', defaultUnit: 'kg', frequency: 10 },
  { id: '19', name: 'Szynka', category: 'Mięso', defaultUnit: 'kg', frequency: 7 },
  { id: '20', name: 'Jogurt', category: 'Nabiał', defaultUnit: 'szt', frequency: 12 }
];

// Factory function to create Google Sheets service for specific user
export async function createUserGoogleSheetsService(userId: string): Promise<{
  service: GoogleSheetsService | null;
  source: 'user' | 'shared' | 'none';
  sourceDisplayName: string;
}> {
  try {
    const effectiveConfig = await UserConfigService.getEffectiveGoogleSheetsConfig(userId);
    
    if (effectiveConfig.source === 'none' || !effectiveConfig.config.apiKey || !effectiveConfig.config.spreadsheetId) {
      return {
        service: null,
        source: 'none',
        sourceDisplayName: getConfigSourceDisplayName('none')
      };
    }

    const service = new GoogleSheetsService(effectiveConfig.config);
    
    return {
      service,
      source: effectiveConfig.source,
      sourceDisplayName: getConfigSourceDisplayName(effectiveConfig.source)
    };
  } catch (error) {
    console.error('Error creating user Google Sheets service:', error);
    return {
      service: null,
      source: 'none',
      sourceDisplayName: getConfigSourceDisplayName('none')
    };
  }
}