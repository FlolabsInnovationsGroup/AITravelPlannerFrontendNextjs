#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Validates that all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

// Load .env.local file manually since Node.js doesn't auto-load it
function loadEnvFile(): Record<string, string> {
    const envPath = path.join(process.cwd(), '.env.local');
    const env: Record<string, string> = {};
    
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    env[key.trim()] = valueParts.join('=').trim();
                }
            }
        }
    } catch (error) {
        console.log('⚠️  Could not read .env.local file:', error);
    }
    
    return env;
}

// Merge loaded env with process.env
const envVars = { ...process.env, ...loadEnvFile() };

const requiredEnvVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
];

const optionalEnvVars = [
    'NEXT_PUBLIC_OPENWEATHER_API_KEY',
    'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN'
];

console.log('🔍 Checking Environment Variables...\n');

let allRequired = true;
let warnings = 0;

// Check required variables
console.log('📋 Required Variables:');
requiredEnvVars.forEach(envVar => {
    const value = envVars[envVar];
    if (!value || value.trim() === '' || value === 'your_api_key_here' || value === 'your_mapbox_token_here') {
        console.log(`❌ ${envVar}: MISSING or using placeholder`);
        allRequired = false;
    } else {
        // Mask sensitive values for display
        const maskedValue = value.length > 10 ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}` : '****';
        console.log(`✅ ${envVar}: ${maskedValue}`);
    }
});

console.log('\n🔧 Optional Variables:');
optionalEnvVars.forEach(envVar => {
    const value = envVars[envVar];
    if (!value || value.trim() === '' || value === 'your_api_key_here' || value === 'your_mapbox_token_here') {
        console.log(`⚠️  ${envVar}: NOT SET (using fallback/mock data)`);
        warnings++;
    } else {
        const maskedValue = value.length > 10 ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}` : '****';
        console.log(`✅ ${envVar}: ${maskedValue}`);
    }
});

console.log('\n📊 Summary:');
console.log(`Required variables: ${allRequired ? '✅ All set' : '❌ Missing some'}`);
console.log(`Optional variables: ${warnings === 0 ? '✅ All set' : `⚠️  ${warnings} missing (will use fallbacks)`}`);

if (!allRequired) {
    console.log('\n🚨 Critical Issues Found:');
    console.log('Please check your .env.local file and ensure all required variables are set.');
    console.log('Example .env.local:');
    console.log('NEXT_PUBLIC_API_URL=http://localhost:8080');
    console.log('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key');
    process.exit(1);
} else if (warnings > 0) {
    console.log('\n⚠️  Warnings Found:');
    console.log('Some optional features may not work without proper API keys.');
    console.log('The system will use fallback data where possible.');
} else {
    console.log('\n🎉 All environment variables are properly configured!');
}

process.exit(0);
