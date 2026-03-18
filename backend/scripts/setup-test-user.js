const axios = require('axios');
const { makeRegisterPayload } = require('./testData');

async function createStaticUser() {
    const email = 'testuser@example.com';
    const password = 'Password@123';

    try {
        console.log('Creating user: testuser@example.com / Password@123');
        await axios.post('http://localhost:5000/api/auth/register', makeRegisterPayload({
            name: 'Test Account',
            email: email,
            password: password,
            role: 'freelancer',
            seed: 101,
        }));
        console.log('User created successfully!');
    } catch (err) {
        if (err.response?.status === 409) {
            console.log('User already exists, ready to login.');
        } else {
            console.error('Failed to create user:', err.response?.data);
        }
    }
}
createStaticUser();
