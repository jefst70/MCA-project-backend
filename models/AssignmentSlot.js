import mongoose from 'mongoose';

const assignmentSlotSchema = new mongoose.Schema(
  {
    // Scope of the slot
    batch:       { type: mongoose.Schema.Types.ObjectId, ref: 'Batch',   required: true },
    semester:    { type: Number, required: true },

    // Subject & teacher
    subjectName: { type: String, required: true },
    teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },

    // Two slots per subject (1 or 2)
    slotNumber:  { type: Number, enum: [1, 2], required: true },

    // Availability window
    openFrom:    { type: Date, required: true },
    openUntil:   { type: Date, required: true },
    isOpen:      { type: Boolean, default: true }
  },
  { timestamps: true }
);

/**
 * Ensure a teacher can create only one slot
 * per subject / batch / semester / slotNumber.
 */
assignmentSlotSchema.index(
  { batch: 1, semester: 1, subjectName: 1, teacher: 1, slotNumber: 1 },
  { unique: true }
);

export default mongoose.model('AssignmentSlot', assignmentSlotSchema);
