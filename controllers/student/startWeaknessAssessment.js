// controllers/student/startWeaknessAssessment.js
import Question from '../../models/Question.js';
import InternalMark from '../../models/InternalMark.js';
import TopicExamAttempt from '../../models/TopicExamAttempt.js';
import WeakTopic from '../../models/WeakTopic.js';
import mongoose from 'mongoose';

export const startWeaknessAssessment = async (req, res) => {
  try {
    const { studentId, subjectId, code } = req.body;

    // 1. Get student's current level for this subject
    const markRecord = await InternalMark.findOne({ student: studentId, code });
    const currentLevel = markRecord?.level || 1;

    // 2. Fetch all distinct topics for the subject
    const allTopics = await Question.distinct('topic', { code, type: 'mcq' });

    // 3. For each topic, fetch a few MCQ questions for the current level
    const topicWiseQuestions = {};

    for (const topic of allTopics) {
      const questions = await Question.aggregate([
        { $match: { code, topic, type: 'mcq', level: { $lte: currentLevel } } },
        { $sample: { size: 3 } }, // Pick 3 random MCQs per topic
      ]);

      if (questions.length > 0) {
        topicWiseQuestions[topic] = questions;
      }
    }

    // 4. If no questions found at all
    if (Object.keys(topicWiseQuestions).length === 0) {
      return res.status(404).json({ error: 'No questions found for weakness assessment.' });
    }

    // 5. Save the exam start attempt metadata (empty for now, results after submission)
    const newAttempt = new TopicExamAttempt({
      student: studentId,
      subjectId,
      code,
      examType: 'assessment',
      levelAtAttempt: currentLevel,
    });

    await newAttempt.save();

    res.json({
      message: 'Assessment started',
      attemptId: newAttempt._id,
      questions: topicWiseQuestions,
    });

  } catch (err) {
    console.error('Error starting weakness assessment:', err);
    res.status(500).json({ error: 'Failed to start assessment' });
  }
};
