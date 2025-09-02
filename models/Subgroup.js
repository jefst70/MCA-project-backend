// models/Subgroup.js
import mongoose from 'mongoose';

const subgroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  semester: { type: Number, required: true, enum: [4] }, // restrict to 4th semester
  messages: [{ 
    sender: { type: String }, 
    content: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  resources: [{
    title: String,
    fileUrl: String, // for uploaded PDF
    driveLink: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'uploadedByType' },
    uploadedByType: { type: String, enum: ['Student', 'Teacher'] },
    uploadedAt: { type: Date, default: Date.now }
  }]
});

export default mongoose.model('Subgroup', subgroupSchema);
