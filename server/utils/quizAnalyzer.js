/**
 * Utility module for grading, tracking, and dissecting quiz performance.
 * Ported from the original Firebase Python Cloud Function architecture.
 */

/**
 * Classifies a user's competency in a specific topic based on their raw score threshold.
 * 
 * @param {number} correct - Total correct answers in this topic
 * @param {number} total - Total questions evaluated in this topic
 * @param {number} [thresholdMastered=0.8] - Percentage threshold (0.0 to 1.0) to be marked as Mastered
 * @param {number} [thresholdNeedsRevision=0.5] - Percentage threshold (0.0 to 1.0) to be marked as Needs Revision
 * @returns {string} One of: "No Questions", "Mastered", "Needs Revision", "Learn from Scratch"
 */
export function classifyTopicPerformance(
  correct, 
  total, 
  thresholdMastered = 0.8, 
  thresholdNeedsRevision = 0.5
) {
  if (total === 0) {
    return "No Questions";
  }

  const scorePercentage = correct / total;

  if (scorePercentage >= thresholdMastered) {
    return "Mastered";
  } else if (scorePercentage >= thresholdNeedsRevision) {
    return "Needs Revision";
  } else {
    return "Learn from Scratch";
  }
}

/**
 * Analyzes a full quiz traversal, cross-referencing user inputs against
 * author specifications to build granular analytics mappings.
 *
 * @param {Object} userAnswers - Key-value map representing the user's answers, e.g., { "0": 2, "1": 1 }
 * @param {Array<Object>} quizQuestions - The Mongoose questions array
 * @returns {Object} Analytical payload matching exactly with expected frontend Results shape
 */
export function analyzeQuizPerformance(userAnswers, quizQuestions) {
  const topicStats = {};
  let totalScore = 0;
  const totalQuestions = quizQuestions?.length || 0;
  const questionBreakdown = [];

  for (let i = 0; i < totalQuestions; i++) {
    const question = quizQuestions[i];
    
    // Safety check parsing answering mapping. Expected format: {"0": 2, "1": -1}
    const rawAnswer = userAnswers[String(i)];
    const userAnswer = rawAnswer !== undefined && rawAnswer !== null ? Number(rawAnswer) : null;
    
    // Identify valid correct keys safely
    const correctAnswer = question.correct ?? question.correctAnswer;
    
    // Topics normalization logic
    let rawTopics = question.topics || question.topic || ['General'];
    const topics = Array.isArray(rawTopics) ? rawTopics : [rawTopics];

    // Determine correctness — checking carefully against "Don't Know" mapping (-1)
    const isDontKnow = userAnswer === -1;
    const isCorrect = !isDontKnow && 
                      userAnswer !== null && 
                      correctAnswer !== null && 
                      userAnswer === Number(correctAnswer);

    if (isCorrect) {
      totalScore += 1;
    }

    // Distribute impacts across requested topic silos
    for (const topic of topics) {
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total += 1;
      
      if (isCorrect) {
        topicStats[topic].correct += 1;
      }
    }

    // Assemble unified feedback projection for the Frontend
    questionBreakdown.push({
      questionId: question.id || question._id || `q_${i}`,
      questionText: question.question || '',
      topic: topics[0],
      userAnswer: userAnswer,
      correctAnswer: correctAnswer,
      isCorrect: isCorrect,
      isDontKnow: isDontKnow,
      options: question.options || []
    });
  }

  // Derive final topic classifications mapping
  const classifiedTopics = {};
  for (const [topic, stats] of Object.entries(topicStats)) {
    const percentage = stats.total > 0 
      ? Math.round((stats.correct / stats.total) * 1000) / 10 // safe float rounding to 1 decimal JS
      : 0;

    classifiedTopics[topic] = {
      classification: classifyTopicPerformance(stats.correct, stats.total),
      correct: stats.correct,
      total: stats.total,
      percentage: percentage
    };
  }

  // Derive overarching summary metrics
  const overallPercentage = totalQuestions > 0 
    ? Math.round((totalScore / totalQuestions) * 1000) / 10 
    : 0;

  return {
    totalScore,
    totalQuestions,
    overallPercentage,
    classifiedTopics,
    questionBreakdown
  };
}
