const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('https://contractual-api.onrender.com/api/auth/register', {
            name: 'test',
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            role: 'freelancer'
        });
        console.log(res.status, res.data);
    } catch (err) {
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
    }
}
test();
