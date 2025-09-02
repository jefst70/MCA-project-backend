// models/SubjectAssignment.js
import mongoose from 'mongoose';

const subjectAssignmentSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  subjectName: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true }
});

export default mongoose.model('SubjectAssignment', subjectAssignmentSchema);
