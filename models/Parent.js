import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  approved: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'terminated'], default: 'active' },
  profilePicture: { type: String, default: '' }
});

export default mongoose.model('Parent', parentSchema);
