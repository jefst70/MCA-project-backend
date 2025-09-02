// controllers/parentController.js
import Parent from '../../models/Parent.js';

export const getParentDashboardData = async (req, res) => {
  try {
    const parentId = req.user._id;

    const parent = await Parent.findById(parentId)
      .populate({
        path: 'child',
        populate: {
          path: 'batch',
          model: 'Batch'
        }
      });

    if (!parent) return res.status(404).json({ message: 'Parent not found' });

    const child = parent.child;
    const batch = child?.batch;

    res.status(200).json({
      parentName: parent.name,
      childName: child?.name || 'Not assigned',
      batchName: batch?.name || 'Not assigned',
      childId: child?._id || '',
      batchId: batch?._id || '',
      semester: child?.semester || '',
    });
  } catch (error) {
    console.error('Error in getParentDashboardData:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
