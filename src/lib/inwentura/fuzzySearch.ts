import { Product } from '@/types/inwentura';

interface FuzzySearchOptions {
  threshold?: number;
  maxResults?: number;
  includeScore?: boolean;
}

interface SearchResult {
  product: Product;
  score: number;
  matches: number[];
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-1, where 1 is perfect match)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const lower1 = str1.toLowerCase();
  const lower2 = str2.toLowerCase();
  
  // Exact match
  if (lower1 === lower2) return 1;
  
  // Starts with
  if (lower1.startsWith(lower2) || lower2.startsWith(lower1)) return 0.9;
  
  // Contains
  if (lower1.includes(lower2) || lower2.includes(lower1)) return 0.8;
  
  // Calculate based on Levenshtein distance
  const distance = levenshteinDistance(lower1, lower2);
  const maxLength = Math.max(str1.length, str2.length);
  const similarity = 1 - (distance / maxLength);
  
  return Math.max(0, similarity);
}

/**
 * Find all matching positions in a string
 */
function findMatches(text: string, query: string): number[] {
  const matches: number[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    matches.push(index);
    index = lowerText.indexOf(lowerQuery, index + 1);
  }
  
  return matches;
}

/**
 * Fuzzy search implementation for products
 */
export function fuzzySearch(
  query: string,
  products: Product[],
  options: FuzzySearchOptions = {}
): SearchResult[] {
  const {
    threshold = 0.3,
    maxResults = 10,
    includeScore = false
  } = options;
  
  if (!query.trim()) return [];
  
  const results: SearchResult[] = [];
  
  for (const product of products) {
    // Calculate scores for different fields
    const nameScore = calculateSimilarity(query, product.name) * 0.6;
    const categoryScore = calculateSimilarity(query, product.category) * 0.3;
    
    // Bonus for frequency (more frequently used products get higher score)
    const frequencyBonus = Math.min((product.frequency || 0) / 100, 0.1);
    
    const totalScore = nameScore + categoryScore + frequencyBonus;
    
    if (totalScore >= threshold) {
      const matches = findMatches(product.name, query);
      
      results.push({
        product,
        score: totalScore,
        matches
      });
    }
  }
  
  // Sort by score (descending) and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Get product suggestions as user types
 */
export function getProductSuggestions(
  query: string,
  products: Product[],
  options: FuzzySearchOptions = {}
): Product[] {
  const results = fuzzySearch(query, products, options);
  return results.map(result => result.product);
}

/**
 * Highlight matching characters in text
 */
export function highlightMatches(text: string, matches: number[]): string {
  if (matches.length === 0) return text;
  
  let result = '';
  let lastIndex = 0;
  
  for (const matchIndex of matches) {
    result += text.substring(lastIndex, matchIndex);
    result += `<strong>${text[matchIndex]}</strong>`;
    lastIndex = matchIndex + 1;
  }
  
  result += text.substring(lastIndex);
  return result;
}

/**
 * Debounce function to limit how often a function is called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}