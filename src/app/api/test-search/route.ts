import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    console.log('Test search API called with query:', JSON.stringify(query));

    // Return simple test data
    return NextResponse.json([
      {
        id: 'test-id',
        name: 'Test Product',
        category: 'Test Category',
        defaultUnit: 'szt',
        frequency: 1,
        score: 100
      }
    ]);

  } catch (error) {
    console.error('Error in test search API:', error);
    return NextResponse.json(
      { error: 'Failed to search products', details: error.message },
      { status: 500 }
    );
  }
}