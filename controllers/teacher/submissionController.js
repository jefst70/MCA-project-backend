import Batch from '../../models/Batch.js';
import Assignment from '../../models/Assignment.js';
import Submission from '../../models/Submission.js';



export const submitAssignment = async (req, res) => {
  try {
    const submission = new Submission(req.body);
    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignmentId: req.params.assignmentId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};


export const updateSubmissionStatus = async (req, res) => {
  const { submissionId } = req.params;
  const { status, feedback } = req.body;
  try {
    const updated = await Submission.findByIdAndUpdate(
      submissionId,
      { status, feedback },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update submission status' });
  }
};
