'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { Product, Unit } from '@/types/inwentura';
import { fuzzySearch, debounce } from '@/lib/inwentura/fuzzySearch';
import { googleSheetsService, isGoogleSheetsConfigured, mockProducts } from '@/lib/inwentura/googleSheets';

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
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useGoogleSheets, setUseGoogleSheets] = useState(isGoogleSheetsConfigured());
  const [isLoadingFromSheets, setIsLoadingFromSheets] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load all products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoadingFromSheets(true);
    setSheetsError(null);
    
    try {
      // Check cache first
      const cached = localStorage.getItem('products_cache');
      const cacheTime = localStorage.getItem('products_cache_time');
      
      // Use cache if it's less than 24 hours old
      if (cached && cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime);
        if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
          setAllProducts(JSON.parse(cached));
          setIsLoadingFromSheets(false);
          return;
        }
      }
      
      // Try to load from Google Sheets
      if (useGoogleSheets) {
        const products = await googleSheetsService.fetchProducts();
        if (products.length > 0) {
          setAllProducts(products);
          // Save to cache
          localStorage.setItem('products_cache', JSON.stringify(products));
          localStorage.setItem('products_cache_time', Date.now().toString());
          return;
        }
      }
      
      // Fallback to mock products if Google Sheets is not configured or empty
      setAllProducts(mockProducts);
      if (useGoogleSheets) {
        setSheetsError('Google Sheets jest pusty lub niedostępny. Używam produktów przykładowych.');
      }
    } catch (error) {
      console.error('Failed to load products from Google Sheets:', error);
      setSheetsError('Błąd ładowania produktów z Google Sheets. Używam produktów przykładowych.');
      setAllProducts(mockProducts);
    } finally {
      setIsLoadingFromSheets(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      
      // Perform fuzzy search
      const results = fuzzySearch(query, allProducts, {
        threshold: 0.3,
        maxResults: 8
      });
      
      setSuggestions(results.map(r => r.product));
      setShowSuggestions(true);
      setIsLoading(false);
    }, 300),
    [allProducts]
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

  const handleSelect = (product: Product) => {
    onChange(product.name);
    onSelect(product);
    
    // Update frequency if using Google Sheets
    if (useGoogleSheets) {
      googleSheetsService.updateProductFrequency(product.id, (product.frequency || 0) + 1)
        .catch(error => console.error('Failed to update frequency:', error));
    }
    
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleAddNew = async () => {
    if (value.trim() && onAddNew) {
      try {
        if (useGoogleSheets) {
          // Try to add to Google Sheets first
          const newProduct = await googleSheetsService.addProduct({
            name: value.trim(),
            category: 'Inne', // Default category
            defaultUnit: 'szt', // Default unit
            frequency: 1
          });
          
          // Update local state and cache
          const updatedProducts = [...allProducts, newProduct];
          setAllProducts(updatedProducts);
          localStorage.setItem('products_cache', JSON.stringify(updatedProducts));
          localStorage.setItem('products_cache_time', Date.now().toString());
          
          onAddNew(newProduct);
        } else {
          // Fallback to local handling
          onAddNew(value.trim());
        }
      } catch (error) {
        console.error('Failed to add product to Google Sheets:', error);
        // Fallback to local handling
        onAddNew(value.trim());
      }
      
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleRefreshProducts = async () => {
    setIsLoadingFromSheets(true);
    setSheetsError(null);
    
    try {
      if (useGoogleSheets) {
        const products = await googleSheetsService.fetchProducts();
        if (products.length > 0) {
          setAllProducts(products);
          // Update cache
          localStorage.setItem('products_cache', JSON.stringify(products));
          localStorage.setItem('products_cache_time', Date.now().toString());
        } else {
          setSheetsError('Google Sheets jest pusty. Używam produktów przykładowych.');
          setAllProducts(mockProducts);
        }
      } else {
        setAllProducts(mockProducts);
      }
    } catch (error) {
      console.error('Failed to refresh products:', error);
      setSheetsError('Błąd odświeżania produktów z Google Sheets.');
      setAllProducts(mockProducts);
    } finally {
      setIsLoadingFromSheets(false);
    }
  };

  const toggleDataSource = () => {
    const newValue = !useGoogleSheets;
    setUseGoogleSheets(newValue);
    if (newValue && isGoogleSheetsConfigured()) {
      handleRefreshProducts();
    } else {
      setAllProducts(mockProducts);
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
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {useGoogleSheets ? 'Google Sheets' : 'Produkty lokalne'}
          </span>
          {isGoogleSheetsConfigured() && (
            <Badge variant={useGoogleSheets ? "default" : "secondary"} className="text-xs">
              {useGoogleSheets ? "Aktywny" : "Nieaktywny"}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isGoogleSheetsConfigured() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDataSource}
              className="h-6 px-2 text-xs"
            >
              {useGoogleSheets ? 'Użyj lokalnych' : 'Użyj Sheets'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshProducts}
            disabled={isLoadingFromSheets}
            className="h-6 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingFromSheets ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {sheetsError && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">{sheetsError}</span>
          </div>
        </div>
      )}

      {/* Configuration warning */}
      {!isGoogleSheetsConfigured() && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Google Sheets nie jest skonfigurowany. Używam produktów przykładowych.
            </span>
          </div>
        </div>
      )}

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
                        <Badge variant="secondary" className="text-xs">
                          {product.frequency || 0}x
                        </Badge>
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
              <div className="p-4 text-center text-muted-foreground">
                Wpisz nazwę produktu, aby zobaczyć sugestie
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}