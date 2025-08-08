const ZAI = require('z-ai-web-dev-sdk');

async function researchGoogleSheets() {
  try {
    const zai = await ZAI.create();
    
    const searchQuery = 'Google Sheets API v4 Node.js authentication Service Account 2024 tutorial';
    console.log('Searching for Google Sheets API integration information...');
    
    const searchResult = await zai.functions.invoke('web_search', {
      query: searchQuery,
      num: 10
    });
    
    console.log('Search results:');
    searchResult.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name} - ${result.url}`);
      console.log(`   ${result.snippet}\n`);
    });
    
    return searchResult;
  } catch (error) {
    console.error('Research failed:', error.message);
  }
}

researchGoogleSheets();