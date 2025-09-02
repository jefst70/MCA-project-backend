import mongoose from 'mongoose';

const feeTransactionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  receiptUrl: {
    type: String, // URL to the generated PDF receipt
  },
  paymentMethod: {
    type: String,
    default: 'razorpay',
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  }
}, {
  timestamps: true
});

const FeeTransaction = mongoose.model('FeeTransaction', feeTransactionSchema);
export default FeeTransaction;
