// Test WebSocket connection to production backend
const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');

// Polyfill for WebSocket in Node.js
global.WebSocket = require('ws');

const API_URL = 'https://api.flomadtravel.com';
const sessionId = 'test-session-' + Date.now();

console.log('Testing WebSocket connection to production backend...');
console.log('API URL:', API_URL);
console.log('Session ID:', sessionId);

const client = new Client({
  webSocketFactory: () => new SockJS(`${API_URL}/ws`),
  connectHeaders: {
    Authorization: `Bearer test-token`
  },
  debug: function (str) {
    console.log('STOMP Debug:', str);
  },
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
});

client.onConnect = function (frame) {
  console.log('✅ Successfully connected to WebSocket!');
  console.log('Connection frame:', frame);
  
  // Subscribe to location events for our test session
  const subscription = client.subscribe(`/topic/locations/${sessionId}`, function (message) {
    console.log('📍 Received location event:', message.body);
  });
  
  console.log('✅ Subscribed to location events for session:', sessionId);
  
  // Test sending a message after 2 seconds
  setTimeout(() => {
    try {
      client.publish({
        destination: '/app/addLocation',
        body: JSON.stringify({
          sessionId: sessionId,
          location: {
            name: 'Test Location',
            lat: 40.7128,
            lng: -74.0060
          }
        })
      });
      console.log('✅ Sent test message to add location');
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }, 2000);
  
  // Disconnect after 10 seconds
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    client.deactivate();
  }, 10000);
};

client.onStompError = function (frame) {
  console.error('❌ Broker reported error:', frame.headers['message']);
  console.error('❌ Additional details:', frame.body);
};

client.onWebSocketError = function (error) {
  console.error('❌ WebSocket error:', error);
};

client.onDisconnect = function () {
  console.log('🔌 Disconnected from WebSocket');
};

// Activate the client
try {
  client.activate();
  console.log('⏳ Attempting to connect...');
} catch (error) {
  console.error('❌ Failed to activate client:', error);
}

// Exit process after 15 seconds
setTimeout(() => {
  console.log('⏰ Test completed');
  process.exit(0);
}, 15000);