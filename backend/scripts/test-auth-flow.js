const axios = require('axios');

async function testAuthFlow() {
    const email = `user_${Date.now()}@example.com`;
    const password = 'Password@123';

    try {
        // 1. Register
        console.log('Registering...');
        const regRes = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'New User',
            email: email,
            password: password,
            role: 'freelancer'
        });
        console.log('Registration Success (201)');

        // 2. Login
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: email,
            password: password
        });
        console.log('Login Success (200):', loginRes.data.user.email);
        console.log('Token Received:', loginRes.data.token.substring(0, 20) + '...');

    } catch (err) {
        console.error('Auth Flow Failed:');
        console.error('Status:', err.response?.status);
        console.error('Data:', JSON.stringify(err.response?.data, null, 2));
    }
}
testAuthFlow();
