import Batch from '../../models/Batch.js';
import Student from '../../models/Student.js';
import mongoose from 'mongoose';
// controllers/batchController.js
// controllers/admin/batchController.js


export const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find().select('_id name');
    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch batches' });
  }
};



export const getLatestBatch = async (req, res) => {
  try {
    const latestBatch = await Batch.findOne({ isLatest: true });
    if (!latestBatch) return res.status(404).json({ message: 'No latest batch found' });
    res.json(latestBatch);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching latest batch' });
  }
};

export const createBatch = async (req, res) => {
  try {
    const { name } = req.body;

    // Step 1: Unset previous latest batch
    await Batch.updateMany({ isLatest: true }, { isLatest: false });

    // Step 2: Create new batch with isLatest true and semester 1
    const newBatch = new Batch({
      name,
      semester: 1,
      isLatest: true,
    });

    await newBatch.save();
    res.status(201).json(newBatch);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create batch', error });
  }
};



export const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find().populate('teachers').lean();
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
};

export const getBatchStudents = async (req, res) => {
  try {
    const students = await Student.find({ batch: req.params.id }).lean();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};
export const promoteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (batch.semester >= 4) {
      return res.status(400).json({ error: 'Cannot promote beyond 4th semester' });
    }

    // ✅ Promote the batch
    batch.semester += 1;

    // ✅ Add new empty subject list for the new semester
    const newSemester = batch.semester;

    // Check if the new semester entry already exists
    const alreadyExists = batch.subjectsBySemester.some(s => s.semester === newSemester);
    if (!alreadyExists) {
      batch.subjectsBySemester.push({
        semester: newSemester,
        subjects: []
      });
    }

    await batch.save();

    // ✅ Promote students in this batch
    await Student.updateMany(
      { batch: batch._id, semester: { $lt: 4 } },
      { $inc: { semester: 1 } }
    );

    res.json({ message: 'Batch and students promoted successfully' });
  } catch (err) {
    console.error('Error promoting batch:', err);
    res.status(500).json({ error: 'Failed to promote batch' });
  }
};

export const assignSubject = async (req, res) => {
  try {
    const { subject, teacherId, code } = req.body; // 👈 Add code to destructuring

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (batch.semester === 4) {
      return res.status(400).json({ error: 'Subject assignment not allowed in 4th semester' });
    }

    let semObj = batch.subjectsBySemester.find(s => s.semester === batch.semester);
    if (!semObj) {
      semObj = { semester: batch.semester, subjects: [] };
      batch.subjectsBySemester.push(semObj);
    }

   semObj.subjects.push({ name: subject, code, teacher: teacherId }); // 👈 Include code

    await batch.save();

    res.json({ message: 'Subject assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign subject' });
  }
};

const teacherSubgroupMap = {}; // In-memory storage; for production, store in DB

export const assignSubgroup = async (req, res) => {
  try {
    const { studentIds, teacherId } = req.body;
    const batchId = req.params.id;

    if (!studentIds?.length || !teacherId || !batchId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    // Check if this teacher already has a subgroup in this batch
    let existingSubgroup = batch.subgroups.find(sg => String(sg.teacher) === teacherId);

    if (!existingSubgroup) {
      // Assign new subgroup number
      const subgroupNumber = batch.subgroups.length + 1;

      // Add new subgroup to batch
      batch.subgroups.push({
        subgroupNumber,
        teacher: teacherId,
        students: studentIds
      });
    } else {
      // Add new students to existing subgroup if not already added
      existingSubgroup.students = [
        ...new Set([...existingSubgroup.students.map(id => String(id)), ...studentIds])
      ];
    }

    // Update subgroup number on students as well
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { subgroup: batch.subgroups.find(sg => String(sg.teacher) === teacherId).subgroupNumber } }
    );

    // Add teacher to batch's teacher list if not already present
    if (!batch.teachers.includes(teacherId)) {
      batch.teachers.push(teacherId);
    }

    await batch.save();

    res.json({ message: 'Subgroup assigned and stored successfully' });

  } catch (err) {
    console.error('Error assigning subgroup:', err);
    res.status(500).json({ error: 'Failed to assign subgroup' });
  }
};
export const deleteBatch = async (req, res) => {
  try {
    const batchId = req.params.id;
    console.log('Deleting batch with ID:', batchId);

    // Delete students
    const studentResult = await Student.deleteMany({ batch: batchId });
    console.log(`Deleted ${studentResult.deletedCount} students`);

    // Delete batch
    const batchResult = await Batch.findByIdAndDelete(batchId);
    if (!batchResult) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json({ message: 'Batch and its students removed successfully' });
  } catch (err) {
    console.error('❌ Delete batch error:', err.message);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
};
