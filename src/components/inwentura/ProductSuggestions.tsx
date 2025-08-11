'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { Product, Unit } from '@/types/inwentura';

interface ProductSuggestion {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  frequency?: number;
  score?: number;
}

interface ProductSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: Product) => void;
  onAddNew?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ProductSuggestions({
  value,
  onChange,
  onSelect,
  onAddNew,
  placeholder = "np. jabłko",
  disabled = false
}: ProductSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [categories, setCategories] = useState<string[]>([]);
  const [popularProducts, setPopularProducts] = useState<ProductSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Query: Categories (cache 10 min, background revalidate)
  useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/inwentura/products/categories');
      if (!res.ok) throw new Error('Failed to load categories');
      return (await res.json()) as string[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    onSuccess: (data) => setCategories(data),
  });

  // Query: Popular products (cache 5 min)
  useQuery({
    queryKey: ['popular-products', 10],
    queryFn: async () => {
      const res = await fetch('/api/inwentura/products/popular?limit=10');
      if (!res.ok) throw new Error('Failed to load popular products');
      return (await res.json()) as ProductSuggestion[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    onSuccess: (data) => setPopularProducts(data),
  });

  const handleRefreshProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['popular-products', 10] });
  };

  // Debounced search function using react-query cache for results reuse
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);

      try {
        const queryKey = ['search-products', query, 8] as const;
        // Try cache first
        const cached = queryClient.getQueryData<ProductSuggestion[]>(queryKey);
        if (cached) {
          setSuggestions(cached);
          setShowSuggestions(true);
          setIsLoading(false);
          // Revalidate in background
          queryClient.invalidateQueries({ queryKey });
          return;
        }

        // Fetch and cache via queryClient
        const data = await queryClient.fetchQuery({
          queryKey,
          queryFn: async () => {
            const response = await fetch(`/api/inwentura/products/search?q=${encodeURIComponent(query)}&limit=8`);
            if (!response.ok) throw new Error('Search request failed');
            return (await response.json()) as ProductSuggestion[];
          },
          staleTime: 60 * 1000, // 1 min
          gcTime: 30 * 60 * 1000,
        });
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to search products:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [queryClient]
  );

  useEffect(() => {
    if (value) {
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, debouncedSearch]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (input) {
        input.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [showSuggestions, suggestions, selectedIndex]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product: ProductSuggestion) => {
    onChange(product.name);
    onSelect({
      id: product.id,
      name: product.name,
      category: product.category,
      defaultUnit: product.defaultUnit as Unit
    });
    
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleAddNew = async () => {
    if (value.trim() && onAddNew) {
      try {
        // Add the new product to the database
        const response = await fetch('/api/inwentura/products/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: value.trim(),
            category: 'Inne', // Default category
            defaultUnit: 'szt' // Default unit
          }),
        });

        if (response.ok) {
          const newProduct = await response.json();
          onAddNew(newProduct);
        } else {
          // Fallback to local handling
          onAddNew(value.trim());
        }
      } catch (error) {
        console.error('Failed to add product:', error);
        // Fallback to local handling
        onAddNew(value.trim());
      }
      
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };



  const canAddNew = value.trim() && !suggestions.some(p => 
    p.name.toLowerCase() === value.toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Data source info panel */}
      <div className="flex items-center justify-between mb-2 p-2 bg-muted rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            Baza danych produktów
          </span>
          <Badge variant="default" className="text-xs">
            Aktywny
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshProducts}
            className="h-6 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>

      {showSuggestions && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg max-h-96 overflow-y-auto"
        >
          <CardContent className="p-0">
            {suggestions.length > 0 ? (
              <div className="py-1">
                {suggestions.map((product, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSelect(product)}
                      className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                        isSelected ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.category} • domyślnie: {product.defaultUnit}
                          </div>
                        </div>
                        {product.score && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(product.score)}%
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : value.trim() ? (
              <div className="p-4 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Nie znaleziono produktu "{value}"
                </p>
                {canAddNew && onAddNew && (
                  <Button
                    onClick={handleAddNew}
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj nowy produkt
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4">
                <div className="mb-3">
                  <h4 className="font-medium text-sm mb-2">Popularne produkty:</h4>
                  <div className="space-y-1">
                    {popularProducts.slice(0, 5).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelect(product)}
                        className="w-full text-left px-2 py-1 hover:bg-accent rounded text-sm transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span>{product.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {product.frequency || 0}x
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-center text-muted-foreground text-xs">
                  Wpisz nazwę produktu, aby zobaczyć sugestie
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
}