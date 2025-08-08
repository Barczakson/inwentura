'use client';

import { InventoryItem, Product, User } from '@/types/inwentura';

const API_BASE_URL = '/api/inwentura';

export interface AddItemPayload {
  user: string;
  product: string;
  weight: number;
  unit: string;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private async request<T>(endpoint: string, payload?: any, method: string = 'POST'): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async addItem(item: AddItemPayload): Promise<ApiResponse<InventoryItem>> {
    return this.request<InventoryItem>('/items/add', item);
  }
  
  async getItems(userId: string): Promise<ApiResponse<InventoryItem[]>> {
    return this.request<InventoryItem[]>(`/items/list?user=${userId}`, undefined, 'GET');
  }
  
  async updateItem(itemId: string, updates: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    return this.request<InventoryItem>(`/items/update/${itemId}`, updates, 'PUT');
  }
  
  async deleteItem(itemId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/items/delete/${itemId}`, undefined, 'DELETE');
  }
  
  async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/products/search', { query });
  }
  
  async addProduct(product: Omit<Product, 'id'>): Promise<ApiResponse<Product>> {
    return this.request<Product>('/products/add', product);
  }
  
  async getCategories(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/products/categories', undefined, 'GET');
  }
  
  async verifyUser(token: string): Promise<ApiResponse<User>> {
    // For now, return a demo user
    return {
      success: true,
      data: {
        id: 'demo-user',
        email: 'demo@example.com',
        displayName: 'Demo User'
      }
    };
  }
}

export const apiService = new ApiService();

// Helper functions for common operations
export async function addInventoryItem(
  userId: string,
  product: string,
  weight: number,
  unit: string
): Promise<ApiResponse<InventoryItem>> {
  const payload: AddItemPayload = {
    user: userId,
    product,
    weight,
    unit,
    timestamp: new Date().toISOString()
  };
  
  return apiService.addItem(payload);
}

export async function getUserInventory(userId: string): Promise<ApiResponse<InventoryItem[]>> {
  return apiService.getItems(userId);
}