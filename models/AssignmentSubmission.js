// models/AssignmentSubmission.js
import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    unique: true  // ensures only one submission per assignment per student
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // assuming unified User model
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index to ensure uniqueness of submission per student per assignment
assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
