import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  amount: Number,
  paymentId: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  semester: { type: Number, required: true },
  totalFee: { type: Number, default: 100000 },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 100000 },
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  paymentHistory: [paymentSchema],
}, { timestamps: true });

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;
