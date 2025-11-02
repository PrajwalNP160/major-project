// Test token generation endpoint
const testToken = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/agora/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        channelName: 'test-channel', 
        uid: 0, 
        role: 'publisher' 
      })
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
};

testToken();
