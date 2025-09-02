import mongoose from 'mongoose';

const weakTopicSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  code: { type: String, required: true },
  topic: { type: String, required: true },
  level: { type: Number, default: 1 }, // Level when weakness was detected
  scorePercent: { type: Number },      // % score in this topic's exam
  identifiedFrom: { type: String, default: 'assessment' },
}, { timestamps: true });

export default mongoose.model('WeakTopic', weakTopicSchema);
