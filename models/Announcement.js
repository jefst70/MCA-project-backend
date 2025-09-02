// models/Announcement.js
import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Announcement', announcementSchema);
