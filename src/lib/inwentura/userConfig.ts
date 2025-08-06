import { User } from '@/types/inwentura';

interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  sheetName: string;
}

interface UserConfig {
  id?: string;
  userId: string;
  googleSheetsConfig?: GoogleSheetsConfig;
  useSharedSheet?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default shared configuration (for users without personal config)
const SHARED_GOOGLE_SHEETS_CONFIG: GoogleSheetsConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || '',
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID || '',
  sheetName: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SHEET_NAME || 'Produkty'
};

export class UserConfigService {
  // Get user configuration
  static async getUserConfig(userId: string): Promise<UserConfig | null> {
    try {
      const response = await fetch(`/api/inwentura/user/config?userId=${userId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching user config:', error);
    }
    return null;
  }

  // Save user configuration
  static async saveUserConfig(userId: string, config: Partial<UserConfig>): Promise<UserConfig | null> {
    try {
      const response = await fetch('/api/inwentura/user/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...config
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error saving user config:', error);
    }
    return null;
  }

  // Get effective Google Sheets configuration for user
  static async getEffectiveGoogleSheetsConfig(userId: string): Promise<{
    config: GoogleSheetsConfig;
    source: 'user' | 'shared' | 'none';
  }> {
    try {
      const userConfig = await this.getUserConfig(userId);
      
      // If user has personal Google Sheets config and it's not using shared sheet
      if (userConfig?.googleSheetsConfig && !userConfig.useSharedSheet) {
        // Validate the config
        if (userConfig.googleSheetsConfig.apiKey && userConfig.googleSheetsConfig.spreadsheetId) {
          return {
            config: userConfig.googleSheetsConfig,
            source: 'user'
          };
        }
      }

      // Check if shared config is available
      if (SHARED_GOOGLE_SHEETS_CONFIG.apiKey && SHARED_GOOGLE_SHEETS_CONFIG.spreadsheetId) {
        return {
          config: SHARED_GOOGLE_SHEETS_CONFIG,
          source: 'shared'
        };
      }

      // No configuration available
      return {
        config: { apiKey: '', spreadsheetId: '', sheetName: 'Produkty' },
        source: 'none'
      };
    } catch (error) {
      console.error('Error getting effective config:', error);
      return {
        config: { apiKey: '', spreadsheetId: '', sheetName: 'Produkty' },
        source: 'none'
      };
    }
  }

  // Check if user has personal Google Sheets configuration
  static async hasPersonalConfig(userId: string): Promise<boolean> {
    try {
      const userConfig = await this.getUserConfig(userId);
      return !!(userConfig?.googleSheetsConfig && !userConfig.useSharedSheet);
    } catch (error) {
      console.error('Error checking personal config:', error);
      return false;
    }
  }

  // Delete user configuration (revert to shared)
  static async deleteUserConfig(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/inwentura/user/config?userId=${userId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting user config:', error);
      return false;
    }
  }
}

// Helper function to get configuration source display name
export function getConfigSourceDisplayName(source: 'user' | 'shared' | 'none'): string {
  switch (source) {
    case 'user':
      return 'Twój osobisty arkusz';
    case 'shared':
      return 'Arkusz współdzielony';
    case 'none':
      return 'Brak konfiguracji';
    default:
      return 'Nieznane';
  }
}