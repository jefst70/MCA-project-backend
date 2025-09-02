// controllers/teacherController.js
import jwt from 'jsonwebtoken';
import Teacher from '../../models/Teacher.js';
import Batch from '../../models/Batch.js';
import StudyMaterial from '../../models/StudyMaterial.js';
import Student from '../../models/Student.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Assignment from '../../models/Assignment.js';
import Submission from '../../models/Submission.js';


dotenv.config();

const SECRET = process.env.JWT_SECRET;


// GET: All assignments for a batch + semester + subject, along with their submissions and student names
export const getAssignmentsWithSubmissions = async (req, res) => {
  try {
    const { batchId, semester, subjectId } = req.params;

    const assignments = await Assignment.find({
      batchId,
      semester: Number(semester),
      subjectId,
    });

    const result = [];

    for (const assignment of assignments) {
      const submissions = await Submission.find({ assignmentId: assignment._id })
        .populate('studentId', 'name') // populate student name only
        .lean();

      const formattedSubs = submissions.map((sub) => ({
        _id: sub._id,
        studentName: sub.studentId?.name || 'Unknown',
        fileUrl: sub.fileUrl,
        status: sub.status,
        feedback: sub.feedback,
        submittedAt: sub.submittedAt,
      }));

      // sort alphabetically by student name
      formattedSubs.sort((a, b) => a.studentName.localeCompare(b.studentName));

      result.push({ assignment, submissions: formattedSubs });
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getAssignmentsWithSubmissions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT: Approve submission
export const approveSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.status = 'Approved';
    submission.feedback = '';
    await submission.save();

    res.json({ message: 'Submission approved' });
  } catch (err) {
    console.error('Error approving submission:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT: Reject submission with feedback
export const rejectSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    if (!feedback) return res.status(400).json({ message: 'Feedback is required' });

    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.status = 'Rejected';
    submission.feedback = feedback;
    await submission.save();

    res.json({ message: 'Submission rejected with feedback' });
  } catch (err) {
    console.error('Error rejecting submission:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getMyBatchesForTeacher = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    const teacherId = decoded.userId;

    const batches = await Batch.find({ 'subjectsBySemester.subjects.teacher': teacherId });

   const filteredBatches = batches.map(batch => {
  const relevantSemesters = batch.subjectsBySemester
    .map(sem => {
      const subjects = sem.subjects
        .filter(sub => sub.teacher.toString() === teacherId)
        .map(sub => ({
          _id: sub._id,
          name: sub.name,
          code: sub.code  // ✅ include subject code here
        }));

      return {
        semester: sem.semester,
        subjects
      };
    })
    .filter(sem => sem.subjects.length > 0);

  return {
    _id: batch._id,
    name: batch.name,
    semester: batch.semester,
    subjectsBySemester: relevantSemesters
  };
});


    const teacher = await Teacher.findById(teacherId);

    res.json({
      teacherName: teacher.name,
      isPlacementOfficer: teacher.isPlacementOfficer,
      batches: filteredBatches
    });
  } catch (err) {
    console.error('Error fetching teacher batches:', err.message);
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

export const uploadStudyMaterial = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { batchId, semester, subject, subjectName, title } = req.body;
    console.log('Received fields:', req.body);
    console.log('Received file:', req.file);


    if (!req.file) {
      return res.status(400).json({ error: 'File upload failed' });
    }

    // Construct the full public URL of the uploaded file
    const fileUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/study-materials/${req.file.filename}`;

    const material = new StudyMaterial({
      teacher: decoded.userId,
      batch: batchId,
      semester,
      subject,
      subjectName,
      title,
      fileUrl, // ✅ Now stored as full public URL
    });

    await material.save();
    res.status(201).json({ message: 'Study material uploaded successfully', material });

  } catch (err) {
    console.error('Upload Error:', err.message);
    res.status(500).json({ error: 'Server error during upload' });
  }
};

export const getStudentsByBatch = async (req, res) => {
  const { batchId } = req.params;
  console.log('Fetching students for batchId:', batchId);

  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    return res.status(400).json({ error: 'Invalid batch ID format' });
  }

  try {
    const students = await Student.find({ batch: batchId, status: 'active' });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students from backend' });
  }
};