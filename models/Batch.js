// models/Batch.js
import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Example: "2024 Batch"
  semester: { type: Number, required: true, default: 1 }, // Current semester for batch

  isLatest: { type: Boolean, default: false }, // ✅ New field to mark latest batch

  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  
  subjectsBySemester: [{
    semester: Number,
    subjects: [{
      name: String,
       code: String, 
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
    }]
  }],

  subgroups: [{
    subgroupNumber: Number,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
  }]
}, { timestamps: true });

export default mongoose.model('Batch', batchSchema);
