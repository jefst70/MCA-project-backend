// controllers/student/submitWeaknessAssessment.js
import TopicExamAttempt from '../../models/TopicExamAttempt.js';
import WeakTopic from '../../models/WeakTopic.js';
import Question from '../../models/Question.js';

export const submitWeaknessAssessment = async (req, res) => {
  try {
    const { attemptId, answers } = req.body; // answers = [{ questionId, selectedOption }]

    // 1. Fetch attempt record
    const attempt = await TopicExamAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    const topicScores = {}; // topic => { correct: x, total: y }

    for (const ans of answers) {
      const q = await Question.findById(ans.questionId);
      if (!q) continue;

      const topic = q.topic;
      if (!topicScores[topic]) {
        topicScores[topic] = { correct: 0, total: 0 };
      }

      topicScores[topic].total++;
      if (q.answer === ans.selectedOption) {
        topicScores[topic].correct++;
      }
    }

    const attemptedTopics = [];
    const weakTopics = [];
    const passThreshold = 60; // % required to pass a topic

    for (const topic in topicScores) {
      const { correct, total } = topicScores[topic];
      const scorePercent = Math.round((correct / total) * 100);

      attemptedTopics.push({ topic, score: correct, total, scorePercent });

      if (scorePercent < passThreshold) {
        // Save or update weak topic
        await WeakTopic.findOneAndUpdate(
          {
            student: attempt.student,
            code: attempt.code,
            topic,
          },
          {
            student: attempt.student,
            subjectId: attempt.subjectId,
            code: attempt.code,
            topic,
            level: attempt.levelAtAttempt,
            scorePercent,
            identifiedFrom: 'assessment',
          },
          { upsert: true, new: true }
        );

        weakTopics.push(topic);
      }
    }

    // 4. Save results in the attempt record
    attempt.attemptedTopics = attemptedTopics;
    attempt.passed = weakTopics.length === 0;
    await attempt.save();

    res.json({
      message: 'Assessment submitted successfully',
      weakTopics,
      passed: attempt.passed,
      detailedTopics: attemptedTopics,
    });
  } catch (err) {
    console.error('Error submitting assessment:', err);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
};
