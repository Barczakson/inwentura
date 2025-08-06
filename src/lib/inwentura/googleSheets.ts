import { Product } from '@/types/inwentura';
import { UserConfigService, getConfigSourceDisplayName } from './userConfig';
import jwt from 'jsonwebtoken';

// Google Sheets API configuration
interface GoogleSheetsConfig {
  sheetsId: string;
  serviceAccountEmail: string;
  privateKey: string;
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
   * Get JWT token for Google Sheets API authentication
   */
  private async getJWTToken(): Promise<string> {
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.config.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    // Clean the private key - remove escaped newlines and quotes if present
    const cleanPrivateKey = this.config.privateKey
      .replace(/\\n/g, '\n')
      .replace(/^"|"$/g, '');

    return jwt.sign(payload, cleanPrivateKey, { algorithm: 'RS256', header });
  }

  /**
   * Get access token for Google Sheets API
   */
  private async getAccessToken(): Promise<string> {
    try {
      const jwtToken = await this.getJWTToken();
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwtToken
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  /**
   * Fetch products from Google Sheets
   * Expected sheet structure:
   * A: ID | B: Nazwa | C: Kategoria | D: Jednostka | E: Częstotliwość
   */
  async fetchProducts(): Promise<Product[]> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetsId}/values/Produkty`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      
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
      const accessToken = await this.getAccessToken();
      const id = `product_${Date.now()}`;
      
      const newRow = [
        id,
        product.name,
        product.category,
        product.defaultUnit,
        product.frequency.toString()
      ];

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetsId}/values/Produkty:append?valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
      const accessToken = await this.getAccessToken();
      
      // First, find the row number for this product
      const products = await this.fetchProducts();
      const productIndex = products.findIndex(p => p.id === productId);
      
      if (productIndex === -1) {
        throw new Error('Product not found');
      }

      // Row number in Google Sheets (accounting for header row)
      const rowNum = productIndex + 2;
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetsId}/values/Produkty!E${rowNum}?valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
  sheetsId: process.env.GOOGLE_SHEETS_ID || '',
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  privateKey: process.env.GOOGLE_PRIVATE_KEY || ''
};

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService(defaultConfig);

// Helper function to check if Google Sheets integration is configured
export function isGoogleSheetsConfigured(): boolean {
  return !!(defaultConfig.sheetsId && defaultConfig.serviceAccountEmail && defaultConfig.privateKey);
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
    
    if (effectiveConfig.source === 'none' || !effectiveConfig.config.sheetsId || !effectiveConfig.config.serviceAccountEmail || !effectiveConfig.config.privateKey) {
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