import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  status: { type: String, enum: ['active', 'terminated'], default: 'active' },
  approved: { type: Boolean, default: false },
  isPlacementOfficer: { type: Boolean, default: false },
  profilePicture: { type: String, default: '' }
});

export default mongoose.model('Teacher', teacherSchema);
