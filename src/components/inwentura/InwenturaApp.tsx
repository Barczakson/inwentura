'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Plus, Trash2, Download, RefreshCw, Shield, LogOut } from 'lucide-react';
import { parseVoiceInput, startVoiceRecognition, testVoiceParser, Unit, VoiceInput } from '@/lib/inwentura/voice';
import { Product } from '@/types/inwentura';
import ProductSuggestions from './ProductSuggestions';

const UNITS: { value: Unit; label: string }[] = [
  { value: 'kg', label: 'kg (kilogramy)' },
  { value: 'g', label: 'g (gramy)' },
  { value: 'l', label: 'l (litry)' },
  { value: 'ml', label: 'ml (mililitry)' },
  { value: 'szt', label: 'szt (sztuki)' }
];

interface InventoryItem {
  id: string;
  product: Product;
  weight: number;
  unit: string;
  timestamp: string;
}

export default function InwenturaApp() {
  const [isListening, setIsListening] = useState(false);
  const [product, setProduct] = useState('');
  const [weight, setWeight] = useState('1');
  const [unit, setUnit] = useState<Unit>('szt');
  const [voiceResult, setVoiceResult] = useState<VoiceInput | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', defaultUnit: 'szt' as Unit });
  const [categories, setCategories] = useState<string[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  
  const recognitionRef = useRef<(() => void) | null>(null);

  // Check authentication and load data on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('inwentura_auth');
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true);
      loadInventory();
      loadCategories();
      initializeProductsIfNeeded();
    }
  }, []);

  // Initialize sample products if needed
  const initializeProductsIfNeeded = async () => {
    try {
      // Check if we have products by trying to get popular ones
      const response = await fetch('/api/inwentura/products/popular?limit=1');
      if (!response.ok || (await response.json()).length === 0) {
        // No products found, initialize sample data
        await fetch('/api/inwentura/products/initialize', { method: 'POST' });
      }
    } catch (error) {
      console.error('Error checking/initializing products:', error);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      autoSave();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [inventory, isAuthenticated]);

  // Warning before leaving page
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (inventory.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [inventory, isAuthenticated]);

  const loadCategories = async () => {
    try {
      // Load categories from API
      const response = await fetch('/api/inwentura/products/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        // Fallback to mock categories
        const mockCategories = ['Owoce', 'Warzywa', 'Nabiał', 'Pieczywo', 'Mięso', 'Napoje', 'Przyprawy', 'Inne'];
        setCategories(mockCategories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      // Fallback to mock categories
      const mockCategories = ['Owoce', 'Warzywa', 'Nabiał', 'Pieczywo', 'Mięso', 'Napoje', 'Przyprawy', 'Inne'];
      setCategories(mockCategories);
    }
  };

  const loadInventory = () => {
    try {
      const saved = localStorage.getItem('inwentura_inventory');
      if (saved) {
        setInventory(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  };

  const saveInventory = (items: InventoryItem[]) => {
    try {
      localStorage.setItem('inwentura_inventory', JSON.stringify(items));
      setLastAutoSave(new Date());
    } catch (err) {
      console.error('Failed to save inventory:', err);
    }
  };

  const autoSave = () => {
    saveInventory(inventory);
  };

  const handleLogin = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('inwentura_auth', 'authenticated');
        setIsAuthenticated(true);
        setShowPasswordDialog(false);
        loadInventory();
        loadCategories();
      } else {
        if (data.configError) {
          setError('Błąd konfiguracji serwera: Hasło nie zostało ustawione. Skontaktuj się z administratorem.');
        } else {
          setError('Nieprawidłowe hasło');
        }
      }
    } catch (err) {
      setError('Wystąpił błąd podczas weryfikacji hasła');
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    setError('');
    setIsListening(true);
    
    recognitionRef.current = startVoiceRecognition(
      (transcript) => {
        const parsed = parseVoiceInput(transcript);
        
        if (parsed.success && parsed.data) {
          setVoiceResult(parsed.data);
          setProduct(parsed.data.product);
          setWeight(parsed.data.weight.toString());
          setUnit(parsed.data.unit);
        } else {
          setError(parsed.error || 'Nie udało się rozpoznać komendy głosowej');
        }
        
        setIsListening(false);
      },
      (errorMessage) => {
        setError(errorMessage);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleAddItem = () => {
    if (!product.trim()) {
      setError('Wprowadź nazwę produktu');
      return;
    }

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      setError('Wprowadź poprawną wagę');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const newItem: InventoryItem = {
        id: `item_${Date.now()}`,
        product: {
          id: `product_${Date.now()}`,
          name: product,
          category: 'Inne',
          defaultUnit: unit
        },
        weight: weightValue,
        unit,
        timestamp: new Date().toISOString()
      };

      const updatedInventory = [newItem, ...inventory];
      setInventory(updatedInventory);
      saveInventory(updatedInventory);
      
      // Reset form
      setProduct('');
      setWeight('1');
      setUnit('szt');
      setVoiceResult(null);
      
    } catch (err) {
      setError('Wystąpił błąd podczas dodawania produktu');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestParser = () => {
    testVoiceParser();
  };

  const handleProductSelect = (selectedProduct: Product) => {
    setProduct(selectedProduct.name);
    
    // Only set default weight if current weight is empty or default (1)
    const currentWeight = parseFloat(weight);
    if (isNaN(currentWeight) || currentWeight === 1 || weight === '' || weight === '1') {
      // Set default weight based on unit only if user hasn't specified a different weight
      if (selectedProduct.defaultUnit === 'szt') {
        setWeight('1');
      } else if (selectedProduct.defaultUnit === 'kg') {
        setWeight('1');
      } else if (selectedProduct.defaultUnit === 'g') {
        setWeight('500');
      } else if (selectedProduct.defaultUnit === 'l') {
        setWeight('1');
      } else if (selectedProduct.defaultUnit === 'ml') {
        setWeight('250');
      }
    }
    
    // Only change unit if the current unit doesn't match the product's default unit
    // or if the current unit is the default 'szt'
    if (unit !== selectedProduct.defaultUnit || unit === 'szt') {
      setUnit(selectedProduct.defaultUnit as Unit);
    }
  };

  const handleAddNewProduct = () => {
    if (!newProduct.name.trim() || !newProduct.category.trim()) {
      setError('Wprowadź nazwę i kategorię produktu');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      setProduct(newProduct.name);
      setUnit(newProduct.defaultUnit);
      setNewProduct({ name: '', category: '', defaultUnit: 'szt' });
      setShowAddProduct(false);
    } catch (err) {
      setError('Wystąpił błąd podczas dodawania produktu');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    const updatedInventory = inventory.filter(item => item.id !== id);
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
  };

  const exportToCSV = () => {
    const headers = ['Nazwa', 'Waga', 'Jednostka', 'Data', 'Czas'];
    const rows = inventory.map(item => [
      item.product.name,
      item.weight.toString(),
      item.unit,
      new Date(item.timestamp).toLocaleDateString('pl-PL'),
      new Date(item.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inwentura_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const exportData = inventory.map(item => ({
      nazwa: item.product.name,
      waga: item.weight,
      jednostka: item.unit,
      data: new Date(item.timestamp).toLocaleDateString('pl-PL'),
      czas: new Date(item.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      timestamp: item.timestamp
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inwentura_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllData = () => {
    if (confirm('Czy na pewno chcesz usunąć wszystkie dane? Tej operacji nie można cofnąć.')) {
      setInventory([]);
      saveInventory([]);
      localStorage.removeItem('inwentura_inventory');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('inwentura_auth');
    setIsAuthenticated(false);
    setShowPasswordDialog(true);
    setPassword('');
    setInventory([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Ochrona dostępu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Wprowadź hasło dostępu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wprowadź hasło"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button onClick={handleLogin} className="w-full" disabled={isProcessing}>
              {isProcessing ? 'Weryfikacja...' : 'Odblokuj aplikację'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inwentura</h1>
          <p className="text-muted-foreground">
            Zarządzaj swoim inwentarzem za pomocą komend głosowych
          </p>
          {lastAutoSave && (
            <p className="text-xs text-muted-foreground">
              Auto-zapis: {lastAutoSave.toLocaleTimeString('pl-PL')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={exportToJSON} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button onClick={clearAllData} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Wyczyść
          </Button>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Wyloguj
          </Button>
        </div>
      </div>

      {/* Voice Recognition Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Rozpoznawanie mowy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              variant={isListening ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? 'Zatrzymaj' : 'Nagraj komendę'}
            </Button>
            
            <Button
              onClick={handleTestParser}
              variant="outline"
              className="flex items-center gap-2"
            >
              Testuj parser
            </Button>
          </div>

          {isListening && (
            <Alert>
              <AlertDescription>
                Nasłuchiwanie... Mów teraz komendę głosową (np. "jabłko dwa kilogramy")
              </AlertDescription>
            </Alert>
          )}

          {voiceResult && (
            <Alert>
              <AlertDescription>
                <strong>Rozpoznano:</strong> {voiceResult.product} - {voiceResult.weight} {voiceResult.unit}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Manual Input Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dodaj produkt ręcznie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Produkt</label>
              <ProductSuggestions
                value={product}
                onChange={setProduct}
                onSelect={handleProductSelect}
                onAddNew={(name) => {
                  setNewProduct({ ...newProduct, name });
                  setShowAddProduct(true);
                }}
                placeholder="np. jabłko"
                disabled={isProcessing}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Waga</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="1"
                disabled={isProcessing}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Jednostka</label>
              <Select value={unit} onValueChange={(value: Unit) => setUnit(value)} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAddItem}
            disabled={isProcessing}
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {isProcessing ? 'Dodawanie...' : 'Dodaj do inwentarza'}
          </Button>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Twój inwentarz ({inventory.length} pozycji)</CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Twój inwentarz jest pusty. Dodaj pierwszy produkt!
            </div>
          ) : (
            <div className="space-y-2">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.weight} {item.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.product.category}</Badge>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nowy produkt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="productName">Nazwa produktu</Label>
              <Input
                id="productName"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="np. truskawki"
                disabled={isProcessing}
              />
            </div>
            
            <div>
              <Label htmlFor="productCategory">Kategoria</Label>
              <Select 
                value={newProduct.category} 
                onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="productUnit">Domyślna jednostka</Label>
              <Select 
                value={newProduct.defaultUnit} 
                onValueChange={(value: Unit) => setNewProduct({ ...newProduct, defaultUnit: value })}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddNewProduct}
                disabled={isProcessing}
                className="flex-1"
              >
                Dodaj produkt
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddProduct(false)}
                disabled={isProcessing}
              >
                Anuluj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}