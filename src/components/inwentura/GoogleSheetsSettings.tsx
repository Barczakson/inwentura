'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Database, Settings, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import GoogleSheetsConfig from './GoogleSheetsConfig';

interface GoogleSheetsSettingsProps {
  onConfigUpdate?: () => void;
}

export default function GoogleSheetsSettings({ onConfigUpdate }: GoogleSheetsSettingsProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/inwentura/config/google-sheets');
      const data = await response.json();
      
      setIsConfigured(data.configured);
      setConfig(data.config);
    } catch (error) {
      console.error('Error checking Google Sheets configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigSave = async (newConfig: any) => {
    try {
      const response = await fetch('/api/inwentura/config/google-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      if (response.ok) {
        await checkConfiguration();
        setIsDialogOpen(false);
        if (onConfigUpdate) {
          onConfigUpdate();
        }
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving Google Sheets configuration:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Google Sheets Integration</span>
        </CardTitle>
        <CardDescription>
          Połącz swoją aplikację z Google Sheets, aby używać własnej listy produktów jako sugestii.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isConfigured ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <span className="font-medium">
              {isConfigured ? 'Połączono z Google Sheets' : 'Nie połączono'}
            </span>
          </div>
          <Badge variant={isConfigured ? "default" : "secondary"}>
            {isConfigured ? "Aktywny" : "Nieaktywny"}
          </Badge>
        </div>

        {/* Configuration Details */}
        {isConfigured && config && (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Arkusz:</span> {config.sheetName || 'Produkty'}
            </div>
            <div className="text-sm">
              <span className="font-medium">Spreadsheet ID:</span> 
              <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">
                {config.spreadsheetId}
              </code>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {!isConfigured && (
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-medium">Aby skonfigurować Google Sheets:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Utwórz projekt w Google Cloud Console</li>
                <li>Włącz Google Sheets API v4</li>
                <li>Utwórz klucz API</li>
                <li>Utwórz arkusz z produktami</li>
                <li>Udostępnij arkusz z dowolnym linkiem</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant={isConfigured ? "outline" : "default"}>
                <Settings className="h-4 w-4 mr-2" />
                {isConfigured ? 'Edytuj konfigurację' : 'Skonfiguruj Google Sheets'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Konfiguracja Google Sheets</DialogTitle>
                <DialogDescription>
                  Połącz swoją aplikację z Google Sheets, aby używać własnej listy produktów.
                </DialogDescription>
              </DialogHeader>
              <GoogleSheetsConfig
                onConfigSave={handleConfigSave}
                currentConfig={config}
              />
            </DialogContent>
          </Dialog>

          {isConfigured && (
            <Button
              variant="outline"
              onClick={checkConfiguration}
            >
              Odśwież status
            </Button>
          )}
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Korzyści z integracji:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Używaj własnej listy produktów jako sugestii</li>
            <li>• Automatycznie aktualizuj częstotliwość użycia</li>
            <li>• Dodawaj nowe produkty bezpośrednio do arkusza</li>
            <li>• Synchronizuj dane między urządzeniami</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}