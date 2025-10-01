// Test Google Maps APIs individually to diagnose the Geocoding issue
const axios = require('axios');

const GOOGLE_MAPS_API_KEY = 'AIzaSyBFLEXJ2OjSRw1q2644PElPy3xtlQdyXTQ';

async function testGoogleAPIs() {
  console.log('🔍 Diagnosing Google Maps API Issues...');
  console.log('API Key (last 4 chars):', GOOGLE_MAPS_API_KEY.slice(-4));
  console.log('='.repeat(50));

  // Test 1: Geocoding API
  console.log('\n1. Testing Geocoding API...');
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: 'New York, NY',
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 10000
    });
    
    console.log('Status:', response.data.status);
    if (response.data.error_message) {
      console.log('Error Message:', response.data.error_message);
    }
    if (response.data.status === 'OK') {
      console.log('✅ Geocoding works!');
    } else {
      console.log('❌ Geocoding issue:', response.data.status);
    }
  } catch (error) {
    console.error('❌ Geocoding request failed:', error.message);
  }

  // Test 2: Places API (Text Search)
  console.log('\n2. Testing Places API (Text Search)...');
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: 'restaurants in New York',
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 10000
    });
    
    console.log('Status:', response.data.status);
    if (response.data.error_message) {
      console.log('Error Message:', response.data.error_message);
    }
    if (response.data.status === 'OK') {
      console.log('✅ Places Text Search works!');
    } else {
      console.log('❌ Places Text Search issue:', response.data.status);
    }
  } catch (error) {
    console.error('❌ Places Text Search request failed:', error.message);
  }

  // Test 3: Places API (Nearby Search)
  console.log('\n3. Testing Places API (Nearby Search)...');
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: '40.7128,-74.0060', // NYC coordinates
        radius: 1000,
        type: 'restaurant',
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 10000
    });
    
    console.log('Status:', response.data.status);
    if (response.data.error_message) {
      console.log('Error Message:', response.data.error_message);
    }
    if (response.data.status === 'OK') {
      console.log('✅ Places Nearby Search works!');
    } else {
      console.log('❌ Places Nearby Search issue:', response.data.status);
    }
  } catch (error) {
    console.error('❌ Places Nearby Search request failed:', error.message);
  }

  // Test 4: Maps JavaScript API (simulate load)
  console.log('\n4. Testing Maps JavaScript API access...');
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/js`, {
      params: {
        key: GOOGLE_MAPS_API_KEY,
        libraries: 'places,geometry'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('✅ Maps JavaScript API accessible');
    }
  } catch (error) {
    console.log('❌ Maps JavaScript API issue:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('💡 Diagnosis complete!');
  console.log('If you see REQUEST_DENIED errors, possible causes:');
  console.log('1. API key restrictions (IP, referrer, or API restrictions)');
  console.log('2. Billing not enabled on Google Cloud project');
  console.log('3. Specific APIs not enabled (Geocoding, Places, etc.)');
  console.log('4. Quota exceeded');
  console.log('='.repeat(50));
}

testGoogleAPIs();