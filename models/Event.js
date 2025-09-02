// models/Event.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  photo: { type: String }, // URL or path to uploaded photo
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Event', eventSchema);
