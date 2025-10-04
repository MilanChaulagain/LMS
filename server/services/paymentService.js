import crypto from 'crypto';
import axios from 'axios';

// Khalti Payment Integration
export const initializeKhaltiPayment = async (paymentData) => {
    try {
        const { amount, purchaseId, productName, customerInfo } = paymentData;
        
        // Ensure amount is a valid number and convert to paisa
        const amountInPaisa = Math.round(parseFloat(amount) * 100);
        
        const khaltiPayload = {
            "return_url": `${process.env.FRONTEND_URL}/payment/success`,
            "website_url": process.env.FRONTEND_URL,
            "amount": amountInPaisa,
            "purchase_order_id": purchaseId,
            "purchase_order_name": productName,
            "customer_info": {
                "name": customerInfo.name || "Test User",
                "email": customerInfo.email || "test@example.com",
                "phone": customerInfo.phone || "9800000000"
            }
        };

        console.log('Khalti Payload:', khaltiPayload);
        console.log('Using Khalti Secret Key:', process.env.KHALTI_SECRET_KEY);
        console.log('Authorization header will be:', `key ${process.env.KHALTI_SECRET_KEY}`);
        
        if (!process.env.KHALTI_SECRET_KEY) {
            throw new Error('KHALTI_SECRET_KEY environment variable is not set');
        }

        const response = await axios.post(
            'https://a.khalti.com/api/v2/epayment/initiate/',
            khaltiPayload,
            {
                headers: {
                    'Authorization': `key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            payment_url: response.data.payment_url,
            pidx: response.data.pidx
        };
    } catch (error) {
        console.error('Khalti payment initialization error:', error.message);
        console.error('Error response status:', error.response?.status);
        console.error('Error response headers:', error.response?.headers);
        console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Full error:', error);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || error.message || 'Payment initialization failed'
        };
    }
};

// Verify Khalti Payment
export const verifyKhaltiPayment = async (pidx) => {
    try {
        const response = await axios.post(
            'https://a.khalti.com/api/v2/epayment/lookup/',
            { pidx },
            {
                headers: {
                    'Authorization': `key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            status: response.data.status,
            transaction_id: response.data.transaction_id,
            total_amount: response.data.total_amount
        };
    } catch (error) {
        console.error('Khalti payment verification error:', error);
        return {
            success: false,
            message: 'Payment verification failed'
        };
    }
};

// eSewa Payment Integration
export const initializeEsewaPayment = (paymentData) => {
    try {
        const { amount, purchaseId, productName } = paymentData;
        
        // Generate signature for eSewa
        const totalAmount = amount.toString();
        const transactionUuid = purchaseId;
        const productCode = 'EPAYTEST'; // Use your actual product code
        
        const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
        const secretKey = process.env.ESEWA_SECRET_KEY;
        
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(message)
            .digest('base64');

        const esewaParams = {
            amount: totalAmount,
            failure_url: `${process.env.FRONTEND_URL}/payment/failure`,
            product_delivery_charge: "0",
            product_service_charge: "0",
            product_code: productCode,
            signature: signature,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            success_url: `${process.env.FRONTEND_URL}/payment/success`,
            tax_amount: "0",
            total_amount: totalAmount,
            transaction_uuid: transactionUuid
        };

        return {
            success: true,
            payment_url: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
            params: esewaParams
        };
    } catch (error) {
        console.error('eSewa payment initialization error:', error);
        return {
            success: false,
            message: 'Payment initialization failed'
        };
    }
};

// Verify eSewa Payment
export const verifyEsewaPayment = async (encodedData) => {
    try {
        const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
        const parsedData = JSON.parse(decodedData);
        
        const { transaction_code, status, total_amount, transaction_uuid } = parsedData;
        
        if (status === 'COMPLETE') {
            return {
                success: true,
                status: 'completed',
                transaction_id: transaction_code,
                total_amount: total_amount,
                purchase_order_id: transaction_uuid
            };
        } else {
            return {
                success: false,
                message: 'Payment not completed'
            };
        }
    } catch (error) {
        console.error('eSewa payment verification error:', error);
        return {
            success: false,
            message: 'Payment verification failed'
        };
    }
};