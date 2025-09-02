import mongoose from 'mongoose';

const topicExamAttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  code: { type: String, required: true },
  examType: { type: String, enum: ['assessment', 'level-improvement'], required: true },
  levelAtAttempt: { type: Number },
  attemptedTopics: [{
    topic: String,
    score: Number,
    total: Number,
    scorePercent: Number
  }],
  passed: { type: Boolean },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('TopicExamAttempt', topicExamAttemptSchema);
