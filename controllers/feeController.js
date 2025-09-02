/*import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';

// ADMIN: View all fees
export const getAllFeesForAdmin = async (req, res) => {
  try {
    const fees = await Fee.find().populate('student').populate('batch');
    res.status(200).json(fees);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching fees', error: err.message });
  }
};

// ADMIN: Create or update fee record
export const createOrUpdateFee = async (req, res) => {
  try {
    const { studentId, batchId, semester, amount, status, dueDate, paidAt, balance } = req.body;

    let fee = await Fee.findOne({ student: studentId, semester });

    if (fee) {
      // Update existing
      fee.amount = amount || fee.amount;
      fee.status = status || fee.status;
      fee.dueDate = dueDate || fee.dueDate;
      fee.paidAt = paidAt || fee.paidAt;
      fee.balance = balance != null ? balance : fee.balance;
      await fee.save();
    } else {
      // Create new
      fee = new Fee({
        student: studentId,
        batch: batchId,
        semester,
        amount,
        status,
        dueDate,
        paidAt,
        balance,
      });
      await fee.save();
    }

    res.status(200).json({ message: 'Fee record updated', fee });
  } catch (err) {
    res.status(500).json({ message: 'Error updating fee', error: err.message });
  }
};

// STUDENT/PARENT: Get fee details
export const getFeesForStudentOrParent = async (req, res) => {
  try {
    const { userId } = req.params;
    let studentId = userId;

    // If it's a parent, get the child's ID
    const parent = await Parent.findById(userId);
    if (parent) studentId = parent.child;

    const fees = await Fee.find({ student: studentId }).populate('batch');
    res.status(200).json(fees);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching fees', error: err.message });
  }
};
*/