'use client';

import { VoiceInput, Unit, ParsedVoiceResult } from '@/types/inwentura';

// Polish number words to digits mapping
const polishNumbers: Record<string, number> = {
  'zero': 0,
  'jeden': 1,
  'dwa': 2,
  'trzy': 3,
  'cztery': 4,
  'pięć': 5,
  'sześć': 6,
  'siedem': 7,
  'osiem': 8,
  'dziewięć': 9,
  'dziesięć': 10,
  'jedenaście': 11,
  'dwanaście': 12,
  'trzynaście': 13,
  'czternaście': 14,
  'piętnaście': 15,
  'szesnaście': 16,
  'siedemnaście': 17,
  'osiemnaście': 18,
  'dziewiętnaście': 19,
  'dwadzieścia': 20,
  'trzydzieści': 30,
  'czterdzieści': 40,
  'pięćdziesiąt': 50,
  'sześćdziesiąt': 60,
  'siedemdziesiąt': 70,
  'osiemdziesiąt': 80,
  'dziewięćdziesiąt': 100,
  'sto': 100,
  'pół': 0.5,
  'półtora': 1.5,
  'ćwierć': 0.25
};

// Polish unit mappings
const unitMappings: Record<string, Unit> = {
  'kilogram': 'kg',
  'kilogramy': 'kg',
  'kilo': 'kg',
  'kg': 'kg',
  'gram': 'g',
  'gramy': 'g',
  'g': 'g',
  'litra': 'l',
  'litry': 'l',
  'litr': 'l',
  'l': 'l',
  'mililitra': 'ml',
  'mililitry': 'ml',
  'mililitr': 'ml',
  'ml': 'ml',
  'sztuka': 'szt',
  'sztuki': 'szt',
  'sztuk': 'szt',
  'szt': 'szt'
};

// Default unit based on common product patterns
const getDefaultUnit = (product: string): Unit => {
  const lowerProduct = product.toLowerCase();
  
  if (lowerProduct.includes('mleko') || lowerProduct.includes('woda') || 
      lowerProduct.includes('sok') || lowerProduct.includes('olej')) {
    return 'l';
  }
  
  if (lowerProduct.includes('cukier') || lowerProduct.includes('mąka') || 
      lowerProduct.includes('ryż') || lowerProduct.includes('kasza')) {
    return 'kg';
  }
  
  if (lowerProduct.includes('chleb') || lowerProduct.includes('jajko') || 
      lowerProduct.includes('jabłko') || lowerProduct.includes('banan')) {
    return 'szt';
  }
  
  return 'szt'; // default unit
};

export function parseVoiceInput(text: string): ParsedVoiceResult {
  try {
    const cleanText = text.toLowerCase().trim();
    
    // Extract weight/number
    let weight = 1; // default weight
    let unit: Unit | null = null;
    let product = '';
    
    // Try to find number patterns
    const numberPatterns = [
      /(\d+(?:[,.]\d+)?)\s*(\w+)?/, // "2 kg", "1.5 litra"
      /(\w+)\s*(\w+)?/ // "dwa kilogramy", "pół litra"
    ];
    
    for (const pattern of numberPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const numberPart = match[1];
        const unitPart = match[2];
        
        // Parse number
        if (/\d/.test(numberPart)) {
          weight = parseFloat(numberPart.replace(',', '.'));
        } else if (polishNumbers[numberPart]) {
          weight = polishNumbers[numberPart];
        }
        
        // Parse unit
        if (unitPart && unitMappings[unitPart]) {
          unit = unitMappings[unitPart];
        }
        
        break;
      }
    }
    
    // Extract product name (remove weight/unit parts)
    product = cleanText;
    
    // Remove number words and units from product name
    Object.keys(polishNumbers).forEach(numWord => {
      product = product.replace(new RegExp(`\\b${numWord}\\b`, 'gi'), '');
    });
    
    Object.keys(unitMappings).forEach(unitWord => {
      product = product.replace(new RegExp(`\\b${unitWord}\\b`, 'gi'), '');
    });
    
    // Remove common words that aren't product names
    const commonWords = ['i', 'oraz', 'czy', 'dodaj', 'mam', 'chcę', 'proszę'];
    commonWords.forEach(word => {
      product = product.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    
    product = product.trim();
    
    // If no unit was found, use default based on product
    if (!unit) {
      unit = getDefaultUnit(product);
    }
    
    if (!product) {
      return {
        success: false,
        error: 'Nie rozpoznano nazwy produktu'
      };
    }
    
    return {
      success: true,
      data: {
        product: product.charAt(0).toUpperCase() + product.slice(1),
        weight,
        unit,
        confidence: 0.8 // Basic confidence score
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Błąd podczas parsowania głosu'
    };
  }
}

export function startVoiceRecognition(
  onResult: (text: string) => void,
  onError: (error: string) => void,
  onEnd: () => void
): () => void {
  if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    onError('Twoja przeglądarka nie obsługuje rozpoznawania mowy');
    return () => {};
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'pl-PL';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };
  
  recognition.onerror = (event) => {
    let errorMessage = 'Błąd rozpoznawania mowy';
    
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'Nie wykryto mowy. Spróbuj ponownie.';
        break;
      case 'audio-capture':
        errorMessage = 'Problem z mikrofonem. Sprawdź ustawienia.';
        break;
      case 'not-allowed':
        errorMessage = 'Dostęp do mikrofonu został zabroniony.';
        break;
      case 'network':
        errorMessage = 'Problem z połączeniem sieciowym.';
        break;
    }
    
    onError(errorMessage);
  };
  
  recognition.onend = () => {
    onEnd();
  };
  
  recognition.start();
  
  return () => {
    recognition.stop();
  };
}

export function testVoiceParser(): void {
  const testPhrases = [
    'jabłko dwa kilogramy',
    'mleko pół litra',
    'chleb jeden',
    'cukier trzy kg',
    'woda jeden i pół litra',
    'jajka dwanaście sztuk'
  ];
  
  console.log('Testing voice parser:');
  testPhrases.forEach(phrase => {
    const result = parseVoiceInput(phrase);
    console.log(`"${phrase}" →`, result);
  });
}