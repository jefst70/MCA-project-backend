  import mongoose from 'mongoose';
  const submissionSchema = new mongoose.Schema({
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    submittedAt: { type: Date, default: Date.now },
    
    fileUrl: String, // or text response
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    feedback: String, // reason if rejected
  });

  export default mongoose.model('Submission', submissionSchema);
