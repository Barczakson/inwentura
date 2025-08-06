export interface Product {
  id: string;
  name: string;
  category: string;
  defaultUnit: Unit;
  frequency?: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  product: Product;
  weight: number;
  unit: Unit;
  timestamp: Date;
  userId: string;
}

export type Unit = 'kg' | 'g' | 'l' | 'ml' | 'szt';

export interface VoiceInput {
  product: string;
  weight: number;
  unit: Unit;
  confidence: number;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
}

export interface ParsedVoiceResult {
  success: boolean;
  data?: VoiceInput;
  error?: string;
}