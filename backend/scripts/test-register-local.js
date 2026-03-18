const axios = require('axios');
const { makeRegisterPayload } = require('./testData');

async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register', makeRegisterPayload({
            name: 'test',
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            role: 'freelancer',
        }));
        console.log(res.status, res.data);
    } catch (err) {
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
    }
}
test();
