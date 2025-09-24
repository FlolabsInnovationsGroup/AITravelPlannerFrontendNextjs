#!/usr/bin/env node
/**
 * Map System Test Runner
 * 
 * This script runs all tests related to the map system components and services.
 * It provides detailed output and coverage information for the travel planning features.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🗺️  Running Map System Test Suite');
console.log('=====================================\n');

const testCategories = [
  {
    name: '🧳 Travel Location Analyzer Service',
    pattern: 'src/services/__tests__/TravelLocationAnalyzer.test.ts',
    description: 'Tests for route optimization, travel analysis, and itinerary planning'
  },
  {
    name: '📍 Location Extraction Service', 
    pattern: 'src/services/__tests__/LocationExtractionService.test.ts',
    description: 'Tests for Google Places API integration and location categorization'
  },
  {
    name: '🧳 Travel Itinerary Component',
    pattern: 'src/components/features/map/__tests__/TravelItinerary.test.tsx',
    description: 'Tests for smart itinerary display and travel recommendations'
  },
  {
    name: '🗺️  Google Map Component',
    pattern: 'src/components/features/map/__tests__/GoogleMapComponent.test.tsx', 
    description: 'Tests for map visualization and marker management'
  },
  {
    name: '🔗 Integration Tests',
    pattern: 'src/components/features/map/__tests__/integration.test.tsx',
    description: 'End-to-end tests for complete travel planning workflow'
  }
];

function runTestCategory(category) {
  console.log(`\n${category.name}`);
  console.log('─'.repeat(50));
  console.log(`📄 ${category.description}\n`);

  try {
    const command = `npx jest "${category.pattern}" --verbose --no-cache`;
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${category.name} - All tests passed!\n`);
  } catch (error) {
    console.log(`❌ ${category.name} - Some tests failed.\n`);
    return false;
  }
  
  return true;
}

function runAllMapTests() {
  console.log('🚀 Running all map system tests together...\n');
  
  try {
    const command = `npx jest "src/(services|components/features/map)/__tests__/" --verbose --coverage --no-cache`;
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('\n🎉 All Map System Tests Completed Successfully!');
    return true;
  } catch (error) {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--all') || args.includes('-a')) {
    // Run all tests together
    runAllMapTests();
  } else if (args.includes('--category') || args.includes('-c')) {
    // Run tests by category
    let allPassed = true;
    for (const category of testCategories) {
      const passed = runTestCategory(category);
      if (!passed) allPassed = false;
    }
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 All Map System Test Categories Passed!');
    } else {
      console.log('⚠️  Some test categories had failures.');
    }
  } else if (args.includes('--help') || args.includes('-h')) {
    // Show help
    console.log('Map System Test Runner Usage:');
    console.log('');
    console.log('Options:');
    console.log('  --all, -a        Run all map tests with coverage');
    console.log('  --category, -c   Run tests by category (default)'); 
    console.log('  --help, -h       Show this help message');
    console.log('');
    console.log('Test Categories:');
    testCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name}`);
      console.log(`     ${cat.description}`);
    });
  } else {
    // Default: run by category
    let allPassed = true;
    for (const category of testCategories) {
      const passed = runTestCategory(category);
      if (!passed) allPassed = false;
    }
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 All Map System Test Categories Passed!');
      console.log('\nTo run all tests with coverage: node test-map.js --all');
    } else {
      console.log('⚠️  Some test categories had failures.');
      console.log('Review the output above and fix failing tests.');
    }
  }
}

main().catch(console.error);
