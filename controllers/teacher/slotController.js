import AssignmentSlot        from '../../models/AssignmentSlot.js';
import AssignmentSubmission  from '../../models/AssignmentSubmission.js';
import Batch                 from '../../models/Batch.js';
import sendMail              from '../../utils/sendMail.js';
import mongoose              from 'mongoose';

/* ----------------------------------------------------------
   Helper: confirm teacher teaches subject in this batch/sem
----------------------------------------------------------- */
const teacherTeaches = async (teacherId, subjectId, batchId, semester) => {
  const batch = await Batch.findById(batchId);
  if (!batch) return false;

  const sem = batch.subjectsBySemester.find(s => s.semester === semester);
  if (!sem) return false;

  return sem.subjects.some(
    s => String(s._id) === String(subjectId) && String(s.teacher) === String(teacherId)
  );
};

/* ────────────────────────────────────────────────────────── */

export const openSlot = async (req, res) => {
  const { subjectId, batchId, semester, title, deadline } = req.body;
  const teacherId = req.user._id;

  /* 1. guard */
  if (!await teacherTeaches(teacherId, subjectId, batchId, semester))
    return res.status(403).json({ message: 'You are not assigned to this subject' });

  /* 2. enforce max-two open slots */
  const openCount = await AssignmentSlot.countDocuments({ teacher: teacherId, subject: subjectId, isOpen: true });
  if (openCount >= 2) return res.status(400).json({ message: 'Maximum two open slots per subject' });

  /* 3. create */
  const slot = await AssignmentSlot.create({
    title,
    subject: subjectId,
    batch : batchId,
    semester,
    teacher: teacherId,
    deadline: deadline ? new Date(deadline) : undefined
  });

  res.json(slot);
};

export const listMySlots = async (req, res) => {
  const slots = await AssignmentSlot.find({ teacher: req.user._id }).sort({ createdAt: -1 });
  res.json(slots);
};

export const closeSlot = async (req, res) => {
  const slot = await AssignmentSlot.findOneAndUpdate(
    { _id: req.params.id, teacher: req.user._id },
    { isOpen: false, closedAt: new Date() },
    { new: true }
  );
  if (!slot) return res.status(404).json({ message: 'Slot not found' });
  res.json(slot);
};

export const listSubmissions = async (req, res) => {
  const submissions = await AssignmentSubmission
     .find({ slot: req.params.id })
     .populate('student', 'name email');
  res.json(submissions);
};

export const reviewSubmission = async (req, res) => {
  const { status, note } = req.body;            // "approved" | "rejected"
  const sub   = await AssignmentSubmission.findById(req.params.id).populate('student');
  if (!sub) return res.status(404).json({ message: 'Submission not found' });

  /* ensure slot belongs to this teacher */
  const slot = await AssignmentSlot.findById(sub.slot);
  if (String(slot.teacher) !== String(req.user._id))
      return res.status(403).json({ message: 'Not your slot' });

  sub.status = status;
  sub.note   = note;
  sub.reviewedAt = new Date();
  await sub.save();

  /* notify student */
  await sendMail({
    to:    sub.student.email,
    subject: `Assignment ${status}`,
    text: `Your submission for "${slot.title}" has been ${status}. ${note ? 'Note: '+note : ''}`
  });

  res.json(sub);
};
