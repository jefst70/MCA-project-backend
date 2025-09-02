import InternalMark from '../../models/InternalMark.js';
import Student from '../../models/Student.js';
import Batch from '../../models/Batch.js';

export const uploadInternalMarks = async (req, res) => {
  try {
    const { batchId, semester, subjectId, code, marks } = req.body;

    console.log("📥 Received upload request");
    console.log("🔢 batchId:", batchId);
    console.log("📚 semester:", semester);
    console.log("📘 subjectId:", subjectId);
    console.log("🧾 code:", code);
    console.log("📦 marks:", marks);

    if (parseInt(semester) === 4) {
      console.warn("⚠️ Attempted to upload marks for final semester.");
      return res.status(400).json({ error: 'Internal marks are not uploaded for final semester.' });
    }

    for (const mark of marks) {
      const {
        studentId,
        internal1 = 0,
        internal2 = 0,
        model = 0,
        assignment1 = 0,
        assignment2 = 0,
        finalExam = null,
        predictedFinal = 0, // ✅ Add this field if you also store ML result
      } = mark;

      const internal1Norm = (internal1 / 50) * 10;
      const internal2Norm = (internal2 / 50) * 10;
      const modelNorm = (model / 100) * 20;
      const assignmentTotal = assignment1 + assignment2;
      const total = internal1 + internal2 + model + assignmentTotal;

      console.log(`🧑 Saving for student ${studentId} with total ${total}`);

      const result = await InternalMark.findOneAndUpdate(
        { student: studentId, subjectId, semester, batch: batchId },
        {
          student: studentId,
          subjectId,
          semester,
          batch: batchId,
          code,
          internal1,
          internal2,
          model,
          assignment1,
          assignment2,
          finalExam,
          predictedFinal, // ✅ Add this to persist ML prediction
          total,
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Upserted mark for ${studentId}:`, result?._id?.toString());
    }

    res.status(200).json({ message: 'Internal marks uploaded successfully including final exam if available. ✅' });
  } catch (err) {
    console.error('❌ Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload internal marks.' });
  }
};

export const getInternalMarks = async (req, res) => {
  try {
    const { batchId, semester, subjectId } = req.params;

    const marks = await InternalMark.find({ batch: batchId, semester, subjectId }).lean();
    const studentIds = marks.map(m => m.student);
    const students = await Student.find({ _id: { $in: studentIds } }).lean();

    const batch = await Batch.findById(batchId).populate('subjectsBySemester.subjects.teacher').lean();

    let subjectName = 'Unknown';
    let teacherName = 'Unknown';

    const semesterEntry = batch?.subjectsBySemester?.find(s => s.semester === parseInt(semester));
    const subjectEntry = semesterEntry?.subjects?.find(s => s._id?.toString() === subjectId);

    if (subjectEntry) {
      subjectName = subjectEntry.name;
      teacherName = subjectEntry.teacher?.name || 'Unknown';
    }

    const results = marks.map(mark => {
      const student = students.find(s => s._id.toString() === mark.student.toString());

      const internal1Norm = (mark.internal1 / 50) * 10;
      const internal2Norm = (mark.internal2 / 50) * 10;
      const modelNorm = (mark.model / 100) * 20;
      const assignmentTotal = (mark.assignment1 || 0) + (mark.assignment2 || 0);
      const total = internal1Norm + internal2Norm + modelNorm + assignmentTotal;

      return {
        name: student?.name || 'Unknown',
        email: student?.email || '',
        internal1: mark.internal1,
        internal2: mark.internal2,
        model: mark.model,
        assignment1: mark.assignment1,
        assignment2: mark.assignment2,
        normalizedMarks: {
          internal1: internal1Norm.toFixed(2),
          internal2: internal2Norm.toFixed(2),
          model: modelNorm.toFixed(2),
          assignmentTotal: assignmentTotal.toFixed(2),
          total: total.toFixed(2),
        }
      };
    });

    // Sort results alphabetically by student name
    results.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      marks: results,
      subject: subjectName,
      teacher: teacherName,
      semester: parseInt(semester),
      batch: batch?.name || 'Unknown'
    });
  } catch (err) {
    console.error('Error fetching internal marks:', err);
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
};
