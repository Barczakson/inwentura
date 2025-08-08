'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface GoogleSheetsConfigProps {
  onConfigSave: (config: {
    apiKey: string;
    spreadsheetId: string;
    sheetName: string;
  }) => void;
  currentConfig?: {
    apiKey: string;
    spreadsheetId: string;
    sheetName: string;
  };
}

export default function GoogleSheetsConfig({ onConfigSave, currentConfig }: GoogleSheetsConfigProps) {
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [spreadsheetId, setSpreadsheetId] = useState(currentConfig?.spreadsheetId || '');
  const [sheetName, setSheetName] = useState(currentConfig?.sheetName || 'Produkty');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    productCount?: number;
  } | null>(null);

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Create a temporary service instance with the current config
      const { googleSheetsService } = await import('@/lib/inwentura/googleSheets');
      const tempService = new (googleSheetsService as any).constructor({
        apiKey,
        spreadsheetId,
        sheetName
      });

      const products = await tempService.fetchProducts();
      
      setTestResult({
        success: true,
        message: `Połączenie udane! Znaleziono ${products.length} produktów.`,
        productCount: products.length
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Błąd połączenia: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onConfigSave({
      apiKey: apiKey.trim(),
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim() || 'Produkty'
    });
  };

  const isValid = apiKey.trim() && spreadsheetId.trim();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Konfiguracja Google Sheets</span>
        </CardTitle>
        <CardDescription>
          Połącz swoją aplikację z Google Sheets, aby używać własnej listy produktów jako sugestii.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <ExternalLink className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-medium">Jak skonfigurować Google Sheets:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Utwórz projekt w Google Cloud Console</li>
              <li>Włącz Google Sheets API v4</li>
              <li>Utwórz klucz API (nie Service Account)</li>
              <li>Utwórz arkusz z kolumnami: ID, Nazwa, Kategoria, Jednostka, Częstotliwość</li>
              <li>Udostępnij arkusz z dowolnym linkiem (Anyone with link)</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Configuration Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Klucz API Google Sheets</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Wklej swój klucz API"
            />
            <p className="text-xs text-muted-foreground">
              Klucz API z Google Cloud Console
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spreadsheetId">ID Arkusza</Label>
            <Input
              id="spreadsheetId"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="np. 1abc123def456ghi789jkl"
            />
            <p className="text-xs text-muted-foreground">
              Z URL arkusza: docs.google.com/spreadsheets/d/<strong>ID</strong>/edit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheetName">Nazwa Arkusza</Label>
            <Input
              id="sheetName"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="Produkty"
            />
            <p className="text-xs text-muted-foreground">
              Nazwa zakładki w arkuszu (domyślnie: Produkty)
            </p>
          </div>
        </div>

        {/* Test Connection */}
        <div className="space-y-3">
          <Button
            onClick={testConnection}
            disabled={!isValid || isTesting}
            variant="outline"
            className="w-full"
          >
            {isTesting ? 'Testowanie...' : 'Testuj połączenie'}
          </Button>

          {testResult && (
            <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                {testResult.message}
                {testResult.success && testResult.productCount !== undefined && (
                  <div className="mt-2">
                    <Badge variant="secondary">
                      {testResult.productCount} produktów
                    </Badge>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Expected Sheet Structure */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Oczekiwana struktura arkusza:</Label>
          <div className="bg-muted p-3 rounded-md">
            <div className="grid grid-cols-5 gap-2 text-xs font-mono">
              <div className="p-2 bg-primary text-primary-foreground rounded text-center">ID</div>
              <div className="p-2 bg-primary text-primary-foreground rounded text-center">Nazwa</div>
              <div className="p-2 bg-primary text-primary-foreground rounded text-center">Kategoria</div>
              <div className="p-2 bg-primary text-primary-foreground rounded text-center">Jednostka</div>
              <div className="p-2 bg-primary text-primary-foreground rounded text-center">Częstotliwość</div>
              
              <div className="p-1 text-center">1</div>
              <div className="p-1">Jabłko</div>
              <div className="p-1">Owoce</div>
              <div className="p-1">szt</div>
              <div className="p-1 text-center">10</div>
              
              <div className="p-1 text-center">2</div>
              <div className="p-1">Mleko</div>
              <div className="p-1">Nabiał</div>
              <div className="p-1">l</div>
              <div className="p-1 text-center">15</div>
            </div>
          </div>
        </div>

        {/* Save Configuration */}
        <Button
          onClick={handleSave}
          disabled={!isValid || (testResult && !testResult.success)}
          className="w-full"
        >
          Zapisz konfigurację
        </Button>
      </CardContent>
    </Card>
  );
}