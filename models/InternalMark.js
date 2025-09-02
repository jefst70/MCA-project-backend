import mongoose from 'mongoose';

const internalMarkSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },

 subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }
,
  semester: { type: Number, required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },

  internal1: { type: Number, default: 0 },      
  internal2: { type: Number, default: 0 },      
  model: { type: Number, default: 0 },          
  assignment1: { type: Number, default: 0 },    
  assignment2: { type: Number, default: 0 },
  code: {type:String},
  finalExam: { type: Number, default: null },
  level: { type: Number, default: null }, // Level assigned by ML (1, 2, 3)
predictedFinal: { type: Number, default: 0 }, // ML predicted score

});

export default mongoose.model('InternalMark', internalMarkSchema);
