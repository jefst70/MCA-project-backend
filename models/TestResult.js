// models/TestResult.js
import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  incorrectTopics: [String], // Detected weak areas
  level: { type: Number },   // Which level this test was
}, { timestamps: true });

export default mongoose.model('TestResult', testResultSchema);
