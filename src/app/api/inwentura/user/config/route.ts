import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/inwentura/user/config?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const config = await db.userConfig.findUnique({
      where: { userId }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching user config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user config' },
      { status: 500 }
    );
  }
}

// POST /api/inwentura/user/config
export async function POST(request: NextRequest) {
  try {
    const { userId, googleSheetsConfig, useSharedSheet } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const config = await db.userConfig.upsert({
      where: { userId },
      update: {
        googleSheetsConfig: googleSheetsConfig ? JSON.stringify(googleSheetsConfig) : null,
        useSharedSheet: useSharedSheet ?? false,
        updatedAt: new Date()
      },
      create: {
        userId,
        googleSheetsConfig: googleSheetsConfig ? JSON.stringify(googleSheetsConfig) : null,
        useSharedSheet: useSharedSheet ?? false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error saving user config:', error);
    return NextResponse.json(
      { error: 'Failed to save user config' },
      { status: 500 }
    );
  }
}

// DELETE /api/inwentura/user/config?userId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await db.userConfig.delete({
      where: { userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user config:', error);
    return NextResponse.json(
      { error: 'Failed to delete user config' },
      { status: 500 }
    );
  }
}