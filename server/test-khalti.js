import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Test endpoint to check Khalti configuration
app.get('/test-khalti-config', (req, res) => {
    res.json({
        khalti_public_key: process.env.KHALTI_PUBLIC_KEY,
        khalti_secret_key: process.env.KHALTI_SECRET_KEY?.substring(0, 10) + '...',
        has_secret_key: !!process.env.KHALTI_SECRET_KEY,
        has_public_key: !!process.env.KHALTI_PUBLIC_KEY
    });
});

// Test endpoint to try Khalti API call
app.post('/test-khalti-payment', async (req, res) => {
    try {
        const testPayload = {
            "return_url": "http://localhost:3000/payment/success",
            "website_url": "http://localhost:3000",
            "amount": 1000, // 10 NPR in paisa
            "purchase_order_id": `test_${Date.now()}`,
            "purchase_order_name": "Test Course",
            "customer_info": {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "9800000000"
            }
        };

        console.log('Testing Khalti API with payload:', JSON.stringify(testPayload, null, 2));
        console.log('Using secret key:', process.env.KHALTI_SECRET_KEY);

        const response = await axios.post(
            'https://a.khalti.com/api/v2/epayment/initiate/',
            testPayload,
            {
                headers: {
                    'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            response: response.data
        });
    } catch (error) {
        console.error('Khalti test error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message,
            stack: error.stack
        });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Khalti test server running on port ${PORT}`);
    console.log('Environment variables loaded:');
    console.log('KHALTI_PUBLIC_KEY:', process.env.KHALTI_PUBLIC_KEY);
    console.log('KHALTI_SECRET_KEY:', process.env.KHALTI_SECRET_KEY?.substring(0, 10) + '...');
});