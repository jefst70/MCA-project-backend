import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  subjectName: String,
  semester: Number,
  startDate: Date,
  endDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileUrl: String, // ✅ New field to store file path
});



export default mongoose.model('Assignment', assignmentSchema);

