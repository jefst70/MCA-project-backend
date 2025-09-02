import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  code: { type: String, required: true },
  topic: { type: String, required: true },
  questionText: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'descriptive'], required: true },
  options: [{ type: String }],  // For MCQs
  answer: { type: String, required: true },
  level: { type: Number, default: 1 },
});

export default mongoose.model('Question', questionSchema);
