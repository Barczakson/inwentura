import { parseVoiceInput } from './voice';

export function runVoiceParserTests() {
  console.log('=== Testing Voice Parser ===\n');
  
  const testCases = [
    {
      input: 'jabłko dwa kilogramy',
      expected: { product: 'Jabłko', weight: 2, unit: 'kg' }
    },
    {
      input: 'mleko pół litra',
      expected: { product: 'Mleko', weight: 0.5, unit: 'l' }
    },
    {
      input: 'chleb jeden',
      expected: { product: 'Chleb', weight: 1, unit: 'szt' }
    },
    {
      input: 'cukier trzy kg',
      expected: { product: 'Cukier', weight: 3, unit: 'kg' }
    },
    {
      input: 'woda jeden i pół litra',
      expected: { product: 'Woda', weight: 1.5, unit: 'l' }
    },
    {
      input: 'jajka dwanaście sztuk',
      expected: { product: 'Jajka', weight: 12, unit: 'szt' }
    },
    {
      input: 'ryż 500 gramów',
      expected: { product: 'Ryż', weight: 500, unit: 'g' }
    },
    {
      input: 'sok pomarańczowy 250 ml',
      expected: { product: 'Sok pomarańczowy', weight: 250, unit: 'ml' }
    }
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: "${testCase.input}"`);
    
    const result = parseVoiceInput(testCase.input);
    
    if (result.success && result.data) {
      const { product, weight, unit } = result.data;
      const expected = testCase.expected;
      
      const productMatch = product === expected.product;
      const weightMatch = Math.abs(weight - expected.weight) < 0.001;
      const unitMatch = unit === expected.unit;
      
      if (productMatch && weightMatch && unitMatch) {
        console.log('✅ PASSED');
        console.log(`   Product: ${product} (expected: ${expected.product})`);
        console.log(`   Weight: ${weight} (expected: ${expected.weight})`);
        console.log(`   Unit: ${unit} (expected: ${expected.unit})`);
        passedTests++;
      } else {
        console.log('❌ FAILED');
        console.log(`   Product: ${product} ${productMatch ? '✅' : '❌'} (expected: ${expected.product})`);
        console.log(`   Weight: ${weight} ${weightMatch ? '✅' : '❌'} (expected: ${expected.weight})`);
        console.log(`   Unit: ${unit} ${unitMatch ? '✅' : '❌'} (expected: ${expected.unit})`);
      }
    } else {
      console.log('❌ FAILED - Parser error:', result.error);
    }
    
    console.log(''); // Empty line for readability
  });
  
  console.log('=== Test Results ===');
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
}

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined') {
  runVoiceParserTests();
}