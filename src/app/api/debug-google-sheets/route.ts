import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const sheetsId = process.env.GOOGLE_SHEETS_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    const debugInfo = {
      timestamp: new Date().toISOString(),
      sheets_configured: {
        sheets_id: sheetsId ? 'SET' : 'NOT_SET',
        sheets_id_value: sheetsId || 'NOT_SET',
        service_account_email: serviceAccountEmail ? 'SET' : 'NOT_SET',
        service_account_email_value: serviceAccountEmail || 'NOT_SET',
        private_key: privateKey ? 'SET' : 'NOT_SET',
        private_key_length: privateKey ? privateKey.length : 0,
        private_key_starts_with: privateKey ? privateKey.substring(0, 50) + '...' : 'NOT_SET',
        private_key_format: privateKey ? (privateKey.includes('-----BEGIN PRIVATE KEY-----') ? 'CORRECT_FORMAT' : 'INCORRECT_FORMAT') : 'NOT_SET'
      }
    };

    // Test Google Sheets authentication if all variables are set
    if (sheetsId && serviceAccountEmail && privateKey) {
      try {
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: serviceAccountEmail,
            private_key: privateKey,
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Test reading the spreadsheet
        const response = await sheets.spreadsheets.get({
          spreadsheetId: sheetsId,
        });

        debugInfo.authentication_test = {
          success: true,
          spreadsheet_title: response.data.properties?.title || 'Unknown',
          spreadsheet_url: response.data.spreadsheetUrl || 'Unknown',
        };
      } catch (error) {
        debugInfo.authentication_test = {
          success: false,
          error: error.message,
          error_details: error.toString(),
        };
      }
    } else {
      debugInfo.authentication_test = {
        success: false,
        error: 'Missing required environment variables',
      };
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: 'Failed to debug Google Sheets',
      error_details: error.message,
    }, { status: 500 });
  }
}