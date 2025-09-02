// controllers/admin/feeController.js
import Student from '../../models/Student.js';
import Batch from '../../models/Batch.js';
import mongoose from 'mongoose';

export const getFeeDetailsByBatch = async (req, res) => {
  const { batchId } = req.params;
  try {
    const students = await Student.find({ batch: batchId })
      .populate('batch', 'name')
      .select('name email fee');
    res.json(students);
  } catch (error) {
    console.error('Error fetching fee details:', error);
    res.status(500).json({ error: 'Failed to fetch fee details' });
  }
};

export const updateFeeDetails = async (req, res) => {
  const { updates } = req.body; // Array of { studentId, paid }

  try {
    const bulkOps = updates.map(({ studentId, paid }) => ({
      updateOne: {
        filter: { _id: studentId },
        update: {
          $set: {
            'fee.paid': paid,
            'fee.pending': { $subtract: ['$fee.total', paid] },
          },
        },
      },
    }));

    await Student.bulkWrite(bulkOps);
    res.json({ message: 'Fee details updated successfully' });
  } catch (error) {
    console.error('Error updating fee details:', error);
    res.status(500).json({ error: 'Failed to update fee details' });
  }
};
