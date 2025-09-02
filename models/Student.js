// models/Student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  semester: { type: Number, default: 1 },
  status: { type: String, enum: ['active', 'terminated'], default: 'active' },
 subgroup: { type: Number, default: 1 },
  approved: { type: Boolean, default: false },
  profilePicture: { type: String, default: '' }
});

export default mongoose.model('Student', studentSchema);
