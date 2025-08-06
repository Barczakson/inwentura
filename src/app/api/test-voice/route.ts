import { NextRequest, NextResponse } from 'next/server';
import { parseVoiceInput } from '@/lib/inwentura/voice';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }
    
    const result = parseVoiceInput(text);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Voice parsing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Test with sample phrases
  const testPhrases = [
    'jabłko dwa kilogramy',
    'mleko pół litra',
    'chleb jeden',
    'cukier trzy kg',
    'woda jeden i pół litra',
    'jajka dwanaście sztuk'
  ];
  
  const results = testPhrases.map(phrase => ({
    input: phrase,
    result: parseVoiceInput(phrase)
  }));
  
  return NextResponse.json({
    message: 'Voice parser test results',
    results
  });
}