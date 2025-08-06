import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, spreadsheetId, sheetName } = await request.json();

    if (!apiKey || !spreadsheetId) {
      return NextResponse.json(
        { error: 'API key and spreadsheet ID are required' },
        { status: 400 }
      );
    }

    // In a real application, you would store this securely
    // For now, we'll store it in the database or environment variables
    
    // Option 1: Store in database (for user-specific config)
    const config = await db.config.upsert({
      where: { key: 'google_sheets' },
      update: {
        value: JSON.stringify({ apiKey, spreadsheetId, sheetName: sheetName || 'Produkty' })
      },
      create: {
        key: 'google_sheets',
        value: JSON.stringify({ apiKey, spreadsheetId, sheetName: sheetName || 'Produkty' })
      }
    });

    // Option 2: Set environment variables (requires server restart)
    // This is just for demonstration - in production, use proper env management
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY = apiKey;
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID = spreadsheetId;
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SHEET_NAME = sheetName || 'Produkty';

    return NextResponse.json({ 
      success: true, 
      message: 'Google Sheets configuration saved successfully' 
    });

  } catch (error) {
    console.error('Error saving Google Sheets configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Try to get configuration from database
    const config = await db.config.findUnique({
      where: { key: 'google_sheets' }
    });

    if (config?.value) {
      const parsedConfig = JSON.parse(config.value);
      return NextResponse.json({ 
        configured: true, 
        config: parsedConfig 
      });
    }

    // Check environment variables as fallback
    const envConfig = {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY,
      spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID,
      sheetName: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SHEET_NAME || 'Produkty'
    };

    const isConfigured = !!(envConfig.apiKey && envConfig.spreadsheetId);

    return NextResponse.json({ 
      configured: isConfigured, 
      config: isConfigured ? envConfig : null 
    });

  } catch (error) {
    console.error('Error getting Google Sheets configuration:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}