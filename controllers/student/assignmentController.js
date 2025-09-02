import Assignment from '../../models/Assignment.js';
import Submission from '../../models/Submission.js';
import path from 'path';
import fs from 'fs';

const __dirname = path.resolve();

export const getOpenAssignments = async (req, res) => {
  const { batch, semester, studentId } = req.body;
  const today = new Date();

  try {
    const all = await Assignment.find({
      batchId: batch,
      semester: semester,
      startDate: { $lte: today },
      endDate: { $gte: today },
    }).sort({ subjectName: 1 });

    const submissions = await Submission.find({ studentId });

    const response = all.map(a => {
      const sub = submissions.find(s => s.assignmentId.toString() === a._id.toString());
      return {
        ...a._doc,
        alreadySubmitted: !!sub && sub.status !== 'Rejected',
        feedback: sub?.status === 'Rejected' ? sub.feedback : null,
      };
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
};

export const submitAssignment = async (req, res) => {
  const { assignmentId, studentId } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'File is required' });

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (new Date() > new Date(assignment.endDate)) {
      return res.status(400).json({ message: 'Deadline passed. Cannot submit.' });
    }

    const existing = await Submission.findOne({ assignmentId, studentId });

    if (existing && existing.status !== 'Rejected') {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }

    if (existing && existing.status === 'Rejected') {
      await Submission.deleteOne({ _id: existing._id });
    }

    const newSubmission = new Submission({
      assignmentId,
      studentId,
      fileUrl: `/uploads/assignments/${file.filename}`
    });

    await newSubmission.save();

    res.json({ message: '✅ Submission successful' });
  } catch (err) {
    res.status(500).json({ message: 'Submission failed' });
  }
};
