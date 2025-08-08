import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sheetsId, serviceAccountEmail, privateKey } = await request.json();

    if (!sheetsId || !serviceAccountEmail || !privateKey) {
      return NextResponse.json(
        { error: 'Google Sheets ID, service account email, and private key are required' },
        { status: 400 }
      );
    }

    // Store configuration in database
    const config = await db.config.upsert({
      where: { key: 'google_sheets' },
      update: {
        value: JSON.stringify({ sheetsId, serviceAccountEmail, privateKey })
      },
      create: {
        key: 'google_sheets',
        value: JSON.stringify({ sheetsId, serviceAccountEmail, privateKey })
      }
    });

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
      sheetsId: process.env.GOOGLE_SHEETS_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY
    };

    const isConfigured = !!(envConfig.sheetsId && envConfig.serviceAccountEmail && envConfig.privateKey);

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