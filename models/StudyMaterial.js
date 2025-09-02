import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  semester: { type: Number, required: true },
 
  subject: { type: String, required: true }, // Subject ID
  subjectName: { type: String, required: true }, // ✅ Add this line
  title: { type: String },
  fileUrl: { type: String, required: true },
  topics: [{ type: String }],  // Optional: Topic tags for smarter matching
level: { type: Number },     // Optional: Recommended level (1, 2, 3)

}, { timestamps: true });

export default mongoose.model('StudyMaterial', studyMaterialSchema);
