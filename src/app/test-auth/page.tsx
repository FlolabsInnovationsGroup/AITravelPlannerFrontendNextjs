'use client';

import { useState, useEffect } from 'react';
import { createGuestToken, createSession, sendMessagesEntity } from '@/lib/api';

export default function TestAuthPage() {
  const [status, setStatus] = useState<string>('Testing...');
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runTests();
  }, []);

  async function runTests() {
    try {
      // Test 1: Create guest token
      setStatus('Step 1: Creating guest token...');
      console.log('🔐 Testing guest token creation');
      
      const guestToken = await createGuestToken();
      console.log('✅ Guest token created:', guestToken?.substring(0, 20) + '...');
      
      if (!guestToken) {
        throw new Error('Failed to create guest token');
      }
      
      setToken(guestToken);
      setStatus('Step 1: ✅ Guest token created');

      // Test 2: Create session
      setStatus('Step 2: Creating session...');
      console.log('📝 Testing session creation');
      
      const session = await createSession('Test Session');
      console.log('✅ Session created:', session);
      
      const sessionIdValue = session.id || session.sessionId;
      if (!sessionIdValue) {
        throw new Error('Failed to create session - no ID returned');
      }
      
      setSessionId(sessionIdValue);
      setStatus('Step 2: ✅ Session created');

      // Test 3: Send chat message
      setStatus('Step 3: Sending chat message...');
      console.log('💬 Testing chat message');
      
      const chatResponse = await sendMessagesEntity(
        'Hello! Can you help me plan a trip?',
        sessionIdValue
      );
      console.log('✅ Chat response:', chatResponse);
      
      if (!chatResponse || !chatResponse.message) {
        throw new Error('Failed to send chat message');
      }
      
      setResponse(chatResponse.message);
      setStatus('Step 3: ✅ Chat message sent and received');

      // All tests passed
      setStatus('🎉 All tests passed! Authentication flow is working.');
      
    } catch (err: any) {
      console.error('❌ Test failed:', err);
      setError(err.message || 'Unknown error');
      setStatus('❌ Test failed - see error below');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Authentication Flow Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Test Status
          </h2>
          <p className="text-lg text-gray-600">{status}</p>
        </div>

        {token && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              JWT Token
            </h2>
            <p className="text-sm text-gray-600 font-mono break-all">
              {token.substring(0, 100)}...
            </p>
          </div>
        )}

        {sessionId && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Session ID
            </h2>
            <p className="text-sm text-gray-600 font-mono">{sessionId}</p>
          </div>
        )}

        {response && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              AI Response
            </h2>
            <p className="text-sm text-gray-600">{response}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              Error
            </h2>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            What This Test Does
          </h3>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>Creates a JWT guest token via /api/auth/guest-token</li>
            <li>Creates a chat session via POST /sessions</li>
            <li>Sends a chat message via POST /api/chat/call/entity</li>
            <li>Verifies the entire authentication → session → chat flow</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
