import Student from '../../models/Student.js';
import Batch from '../../models/Batch.js';
import Assignment from '../../models/Assignment.js';
import AssignmentSlot from '../../models/AssignmentSlot.js';

export const getAvailableSubjects = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).populate('batch');
    const batch = await Batch.findById(student.batch);
    const semesterSubjects = batch.subjectsBySemester.find(s => s.semester === student.semester);

    const openSlots = await AssignmentSlot.find({
      batch: batch._id,
      semester: student.semester,
      isOpen: true
    });

    const openSubjectNames = openSlots.map(slot => slot.subject);

    const availableSubjects = semesterSubjects.subjects.filter(sub =>
      openSubjectNames.includes(sub.name)
    );

    res.json({ subjects: availableSubjects });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subjects', error });
  }
};

export const uploadAssignment = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    const batch = await Batch.findById(student.batch);
    const semesterSubjects = batch.subjectsBySemester.find(s => s.semester === student.semester);
    const subjectName = req.body.subject;

    const matchedSubject = semesterSubjects.subjects.find(sub => sub.name === subjectName);
    if (!matchedSubject) return res.status(400).json({ message: 'Subject not found' });

    const slot = await AssignmentSlot.findOne({
      subject: subjectName,
      semester: student.semester,
      batch: batch._id,
      isOpen: true
    });

    if (!slot) return res.status(403).json({ message: 'Slot is closed' });

    const assignment = new Assignment({
      student: student._id,
      subject: subjectName,
      teacher: matchedSubject.teacher,
      semester: student.semester,
      file: req.file.filename
    });

    await assignment.save();
    res.json({ message: 'Assignment uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error });
  }
};
