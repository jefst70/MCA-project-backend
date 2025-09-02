import Razorpay from 'razorpay';
import crypto from 'crypto';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import { sendMail } from '../utils/sendBillEmail.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const getStudentFeeDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const fee = await Fee.findOne({ student: studentId });
    if (!fee) {
      return res.status(404).json({ error: 'Fee details not found for the student' });
    }
    res.json(fee);
  } catch (err) {
    console.error('Error fetching fee details:', err);
    res.status(500).json({ error: 'Failed to fetch fee details from backend fee controller' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Error in creating order:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, studentId, amount } = req.body;
  console.log('🔍 Razorpay payment verification triggered');
  console.log('Request body:', req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  const fee = await Fee.findOne({ student: studentId });
  if (!fee) return res.status(404).json({ error: 'Fee record not found' });

  const paidAmount = parseInt(amount);
  fee.amountPaid += paidAmount;
  fee.balance = fee.totalFee - fee.amountPaid;
  fee.status = fee.balance <= 0 ? 'paid' : 'partial';

  fee.paymentHistory.push({
    amount: paidAmount,
    paymentId: razorpay_payment_id,
    status: 'Success',
  });

  await fee.save();

  const student = await Student.findById(studentId);
  const parent = await Parent.findOne({ child: studentId });

  if (parent) {
    await sendMail({
      to: parent.email,
      subject: '📄 Payment Receipt - Campus Connect',
      text: `Payment of ₹${paidAmount} successful for ${student.name}. Remaining balance: ₹${fee.balance}.`,
    });
  }

  res.json({ message: 'Payment verified and updated successfully' });
};
