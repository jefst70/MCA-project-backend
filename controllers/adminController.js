import Batch from '../models/Batch.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Teacher from '../models/Teacher.js';
import Event from '../models/Event.js';
import Achievement from '../models/Achievement.js';
import Announcement from '../models/Announcement.js';
import SubjectAssignment from '../models/SubjectAssignment.js';
import Fee from '../models/Fee.js';
import mongoose from 'mongoose';


export const createBatch = async (req, res) => {
  const { name } = req.body;
  try {
    const batch = await Batch.create({ name });
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ message: 'Batch creation failed' });
  }
};
export const getAllUsersForApproval = async (req, res) => {
  try {
    const students = await Student.find();
    const parents = await Parent.find().populate('child', 'name'); // <-- updated from student to child
    const teachers = await Teacher.find();
    res.json({ students, parents, teachers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};


// controllers/adminController.js


export const getBatchWiseFeeData = async (req, res) => {
  try {
    const { batchId } = req.params;
    const fees = await Fee.find({ batch: batchId }).populate('student', 'name');

    const grouped = {
      pending: [],
      partial: [],
      paid: [],
    };

    fees.forEach(fee => {
      grouped[fee.status].push(fee);
    });

    res.json(grouped);
  } catch (err) {
    console.error('Error fetching fee data:', err);
    res.status(500).json({ error: 'Failed to fetch fee data' });
  }
};
export const deleteUser = async (req, res) => {
  const { role, id } = req.params;

  let Model;
  if (role === 'student') Model = Student;
  else if (role === 'parent') Model = Parent;
  else if (role === 'teacher') Model = Teacher;
  else return res.status(400).json({ message: 'Invalid role' });

  try {
    const user = await Model.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Optional cleanup: Remove student from Batch.students array
    if (role === 'student' && user.batch) {
      await Batch.findByIdAndUpdate(user.batch, {
        $pull: { students: user._id },
      });
    }

    res.json({ message: `${role} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting user' });
  }
};


export const updateUserApprovalStatus = async (req, res) => {
  const { role, id } = req.params;
  const { approved } = req.body;

  let Model;
  if (role === 'student') Model = Student;
  else if (role === 'parent') Model = Parent;
  else if (role === 'teacher') Model = Teacher;
  else return res.status(400).json({ message: 'Invalid role' });

  try {
    let user;

    if (role === 'student') {
      // ✅ Update approval status
      user = await Student.findByIdAndUpdate(id, { approved }, { new: true });
      if (!user) return res.status(404).json({ message: 'Student not found' });

      if (approved) {
        // ✅ Find latest batch
        const latestBatch = await Batch.findOne({ isLatest: true });
        if (!latestBatch) {
          return res.status(404).json({ message: 'Latest batch not found' });
        }

        // ✅ Add student to batch
        await Batch.findByIdAndUpdate(latestBatch._id, {
          $addToSet: { students: user._id },
        });

        // ✅ Update student's batch and semester (if not already stored)
        user.batch = latestBatch._id;
        user.semester = 1;
        await user.save();

        // ✅ Create Fee document
        const existingFee = await Fee.findOne({ student: user._id });
        if (!existingFee) {
          const newFee = new Fee({
            student: user._id,
            batch: latestBatch._id,
            semester: 1,
            totalFee: 100000,
            amountPaid: 0,
            balance: 100000,
            status: 'pending',
            paymentHistory: [],
          });

          await newFee.save();
        }
      }

    } else {
      // ✅ Approve/reject parent or teacher
      user = await Model.findByIdAndUpdate(id, { approved }, { new: true });
      if (!user) return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `User ${approved ? 'approved' : 'rejected'}`, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating user approval status' });
  }
};

export const getBatches = async (_, res) => {
  const batches = await Batch.find();
  res.json(batches);
};

export const approveStudent = async (req, res) => {
  await Student.findByIdAndUpdate(req.params.id, { approved: true });
  res.json({ message: 'Student approved' });
};

export const rejectStudent = async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: 'Student rejected' });
};

export const approveParent = async (req, res) => {
  await Parent.findByIdAndUpdate(req.params.id, { approved: true });
  res.json({ message: 'Parent approved' });
};

export const rejectParent = async (req, res) => {
  await Parent.findByIdAndDelete(req.params.id);
  res.json({ message: 'Parent rejected' });
};

export const assignSubjectToTeacher = async (req, res) => {
  const { teacherId, batchId, subject } = req.body;
  await SubjectAssignment.create({ teacher: teacherId, batch: batchId, subject });
  res.status(201).json({ message: 'Subject assigned to teacher' });
};

export const postEvent = async (req, res) => {
  const { title, description, image } = req.body;
  await Event.create({ title, description, image });
  res.json({ message: 'Event posted' });
};

export const postAchievement = async (req, res) => {
  const { title, description, image } = req.body;
  await Achievement.create({ title, description, image });
  res.json({ message: 'Achievement posted' });
};

export const postAnnouncement = async (req, res) => {
  const { message } = req.body;
  await Announcement.create({ message });
  res.json({ message: 'Announcement posted' });
};

export const updateFees = async (req, res) => {
  const { status, amount } = req.body;
  await Student.findByIdAndUpdate(req.params.studentId, { fees: { status, amount } });
  res.json({ message: 'Fees updated' });
};





export const promoteStudents = async (_, res) => {
  const students = await Student.find({});
  for (const student of students) {
    if (student.semester < 4) {
      student.semester += 1;
      await student.save();
    } else {
      await Student.findByIdAndDelete(student._id); // terminate after 4th semester
    }
  }
  res.json({ message: 'Promotion complete' });
};
export const promoteStudentsInBatch = async (req, res) => {
  const { batchId } = req.params;

  try {
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const students = await Student.find({ batch: batchId, status: 'active' });

    for (const student of students) {
      if (student.semester < 4) {
        student.semester += 1;
      } else {
        student.status = 'terminated';
      }
      await student.save();
    }

    if (batch.semester < 4) batch.semester += 1;
    await batch.save();

    res.json({ message: 'Students promoted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error promoting students' });
  }
};

// Assign subjects and teachers to a semester in a batch (for semester <= 3)
export const assignSubjectsToSemester = async (req, res) => {
  const { batchId } = req.params;
  const { semester, subjects } = req.body;

  if (semester > 3) {
    return res.status(400).json({ message: 'Cannot assign subjects to semester 4' });
  }

  try {
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const index = batch.subjectsBySemester?.findIndex(s => s.semester === semester);

    if (index >= 0) {
      batch.subjectsBySemester[index].subjects = subjects;
    } else {
      if (!batch.subjectsBySemester) batch.subjectsBySemester = [];
      batch.subjectsBySemester.push({ semester, subjects });
    }

    await batch.save();
    res.json({ message: 'Subjects assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to assign subjects' });
  }
};

// Assign subgroups (and optionally teacher) to 4th semester students
export const assignSubgroups = async (req, res) => {
  const { studentIds, subgroupNumber, teacherId } = req.body;

  try {
    await Student.updateMany(
      { _id: { $in: studentIds }, semester: 4 },
      { $set: { subgroup: subgroupNumber } }
    );

    // Optional: assign teacher to batch teacher list if not already present
    if (teacherId) {
      const student = await Student.findById(studentIds[0]);
      if (student) {
        const batch = await Batch.findById(student.batch);
        if (batch && !batch.teachers.includes(teacherId)) {
          batch.teachers.push(teacherId);
          await batch.save();
        }
      }
    }

    res.json({ message: 'Subgroup assignment successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error assigning subgroup' });
  }
};

// Fetch all approved teachers
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({ approved: true }).select('name email');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching teachers' });
  }
};

// Get students by batch
export const getStudentsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const students = await Student.find({ batch: batchId, approved: true }).select('name email semester subgroup');
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching students' });
  }
};