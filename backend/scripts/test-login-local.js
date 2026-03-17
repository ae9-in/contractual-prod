const axios = require('axios');

async function testLogin() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test_1773734986282@example.com', // Use the email from the previous successful registration
            password: 'password123'
        });
        console.log('Login Success:', res.status, res.data);
    } catch (err) {
        console.error('Login Failed:', err.response?.status, err.response?.data);
    }
}
testLogin();
