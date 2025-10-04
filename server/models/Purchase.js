import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
    courseId: {type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true},
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {type: Number, required: true},
    status: {type: String, enum: ['pending', 'completed', 'failed'], default: 'pending'},
    paymentMethod: {type: String, enum: ['khalti', 'esewa', 'stripe'], default: 'khalti'},
    paymentReference: {type: String}, // Store pidx for Khalti, transaction_uuid for eSewa
    transactionId: {type: String} // Store actual transaction ID after payment completion
}, {timestamps: true})


 export const Purchase = mongoose.model('Purchase', PurchaseSchema)