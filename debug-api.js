// Debug script to test the chat API directly
const axios = require('axios');

async function testChatAPI() {
    try {
        console.log('🔍 Testing chat API endpoint...');
        
        // First, let's try to get a guest token
        console.log('🎫 Getting guest token...');
        const guestResponse = await axios.post('http://localhost:8080/api/auth/guest-token', {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Guest token response:', guestResponse.data);
        const token = guestResponse.data.token;
        
        // Now test the chat API with a simple message
        console.log('💬 Testing chat API with guest token...');
        
        const formData = new FormData();
        formData.append('sessionId', 'test-session-' + Date.now());
        formData.append('message', 'Create a foodie tour through Italy');
        
        const chatResponse = await axios.post('http://localhost:8080/api/chat/call/entity', formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            },
            timeout: 30000
        });
        
        console.log('✅ Chat API response:', chatResponse.data);
        
    } catch (error) {
        console.error('❌ Error testing API:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers
        });
    }
}

testChatAPI();