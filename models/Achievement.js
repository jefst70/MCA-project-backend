// models/Achievement.js
import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  photo: { type: String },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Achievement', achievementSchema);
