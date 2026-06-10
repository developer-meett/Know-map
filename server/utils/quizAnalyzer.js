/**
 * Utility module for grading, tracking, and dissecting quiz performance.
 * Upgraded with Advanced Knowledge Gap Detection features.
 */

/**
 * Classifies a user's competency in a specific topic based on their weighted score threshold.
 * 
 * @param {number} earnedWeight - Total earned weight in this topic
 * @param {number} totalWeight - Total possible weight in this topic
 * @param {number} [thresholdMastered=0.8] - Percentage threshold (0.0 to 1.0) to be marked as Mastered
 * @param {number} [thresholdNeedsRevision=0.5] - Percentage threshold (0.0 to 1.0) to be marked as Needs Revision
 * @param {number} [dontKnowRatio=0] - Ratio of "Don't Know" answers (0.0 to 1.0)
 * @returns {string} One of: "No Questions", "Mastered", "Needs Revision", "Learn from Scratch"
 */
export function classifyTopicPerformance(
  earnedWeight, 
  totalWeight, 
  thresholdMastered = 0.8, 
  thresholdNeedsRevision = 0.5,
  dontKnowRatio = 0
) {
  if (totalWeight === 0) {
    return "No Questions";
  }

  // Feature 5: Smarter Don't Know Logic override
  if (dontKnowRatio >= 0.5) {
    return "Learn from Scratch";
  }

  const scorePercentage = earnedWeight / totalWeight;

  if (scorePercentage >= thresholdMastered) {
    return "Mastered";
  } else if (scorePercentage >= thresholdNeedsRevision) {
    return "Needs Revision";
  } else {
    return "Learn from Scratch";
  }
}

/**
 * Feature 4: Calculates confidence level based on number of questions answered.
 * 
 * @param {number} questionsAnswered - Total historical questions answered for this topic/subtopic
 * @returns {string} One of: "Low", "Medium", "High"
 */
export function calculateConfidence(questionsAnswered) {
  if (questionsAnswered <= 4) return "Low";
  if (questionsAnswered <= 9) return "Medium";
  return "High";
}

/**
 * Analyzes a full quiz traversal, cross-referencing user inputs against
 * author specifications to build granular analytics mappings.
 * Includes subtopic analytics, weighted scoring, and confidence calculations.
 *
 * @param {Object} userAnswers - Key-value map representing the user's answers, e.g., { "0": 2, "1": 1 }
 * @param {Array<Object>} quizQuestions - The Mongoose questions array
 * @param {Object} [historicalCounts={}] - Map of historical question counts for topic/subtopic confidence
 * @returns {Object} Analytical payload matching exactly with expected frontend Results shape
 */
export function analyzeQuizPerformance(userAnswers, quizQuestions, historicalCounts = {}) {
  const topicStats = {};
  let totalEarnedWeight = 0;
  let totalPossibleWeight = 0;
  const totalQuestions = quizQuestions?.length || 0;
  const questionBreakdown = [];

  for (let i = 0; i < totalQuestions; i++) {
    const question = quizQuestions[i];
    
    // Support both ID-based and legacy index-based submissions
    const qid = (question._id && question._id.toString()) || question.id;
    let rawAnswer = userAnswers[qid];
    if (rawAnswer === undefined) {
      rawAnswer = userAnswers[String(i)];
    }
    
    const userAnswer = rawAnswer !== undefined && rawAnswer !== null ? Number(rawAnswer) : null;
    
    // Identify valid correct keys safely
    const correctAnswer = question.correct ?? question.correctAnswer;
    
    // Topics normalization logic
    let rawTopics = question.topics || question.topic || ['General'];
    const topics = Array.isArray(rawTopics) ? rawTopics : [rawTopics];
    const subtopic = question.subtopic || 'General';

    // Parse weight and difficulty mapping
    let weight = question.weight;
    if (weight === undefined || weight === null) {
      if (question.difficulty === 'hard') weight = 3;
      else if (question.difficulty === 'easy') weight = 1;
      else weight = 2; // medium default
    }

    // Determine correctness — checking carefully against "Don't Know" mapping (-1)
    const isDontKnow = userAnswer === -1;
    const isCorrect = !isDontKnow && 
                      userAnswer !== null && 
                      correctAnswer !== null && 
                      userAnswer === Number(correctAnswer);

    totalPossibleWeight += weight;
    if (isCorrect) {
      totalEarnedWeight += weight;
    }

    // Distribute impacts across requested topic silos
    for (const topic of topics) {
      if (!topicStats[topic]) {
        topicStats[topic] = { earnedWeight: 0, totalWeight: 0, dontKnowCount: 0, questionsAnswered: 0, subtopics: {} };
      }
      topicStats[topic].totalWeight += weight;
      topicStats[topic].questionsAnswered += 1;
      
      if (!topicStats[topic].subtopics[subtopic]) {
        topicStats[topic].subtopics[subtopic] = { earnedWeight: 0, totalWeight: 0, dontKnowCount: 0, questionsAnswered: 0 };
      }
      topicStats[topic].subtopics[subtopic].totalWeight += weight;
      topicStats[topic].subtopics[subtopic].questionsAnswered += 1;

      if (isCorrect) {
        topicStats[topic].earnedWeight += weight;
        topicStats[topic].subtopics[subtopic].earnedWeight += weight;
      } else if (isDontKnow) {
        topicStats[topic].dontKnowCount += 1;
        topicStats[topic].subtopics[subtopic].dontKnowCount += 1;
      }
    }

    // Assemble unified feedback projection for the Frontend
    questionBreakdown.push({
      questionId: question.id || question._id || `q_${i}`,
      questionText: question.question || '',
      topic: topics[0],
      subtopic: subtopic,
      difficulty: question.difficulty || 'medium',
      weight: weight,
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
    const topicDontKnowRatio = stats.questionsAnswered > 0 ? stats.dontKnowCount / stats.questionsAnswered : 0;
    const topicPercentage = stats.totalWeight > 0 
      ? Math.round((stats.earnedWeight / stats.totalWeight) * 1000) / 10 
      : 0;

    const historicalTopicCount = (historicalCounts[topic] || 0) + stats.questionsAnswered;

    const classifiedSubtopics = {};
    for (const [subtopic, subStats] of Object.entries(stats.subtopics)) {
      const subDontKnowRatio = subStats.questionsAnswered > 0 ? subStats.dontKnowCount / subStats.questionsAnswered : 0;
      const subPercentage = subStats.totalWeight > 0 
        ? Math.round((subStats.earnedWeight / subStats.totalWeight) * 1000) / 10 
        : 0;
      
      const subKey = `${topic}::${subtopic}`;
      const historicalSubCount = (historicalCounts[subKey] || 0) + subStats.questionsAnswered;

      classifiedSubtopics[subtopic] = {
        classification: classifyTopicPerformance(subStats.earnedWeight, subStats.totalWeight, 0.8, 0.5, subDontKnowRatio),
        confidence: calculateConfidence(historicalSubCount),
        earnedWeight: subStats.earnedWeight,
        totalWeight: subStats.totalWeight,
        percentage: subPercentage,
        questionsAnswered: subStats.questionsAnswered
      };
    }

    // Map `correct` and `total` to `earnedWeight` and `totalWeight` respectively 
    // to keep backwards compatibility with UI mapping loosely, 
    // but expose the actual weights properly for the updated UI.
    classifiedTopics[topic] = {
      classification: classifyTopicPerformance(stats.earnedWeight, stats.totalWeight, 0.8, 0.5, topicDontKnowRatio),
      confidence: calculateConfidence(historicalTopicCount),
      earnedWeight: stats.earnedWeight,
      totalWeight: stats.totalWeight,
      correct: stats.earnedWeight, // Legacy fallback
      total: stats.totalWeight,    // Legacy fallback
      percentage: topicPercentage,
      questionsAnswered: stats.questionsAnswered,
      subtopics: classifiedSubtopics
    };
  }

  // Derive overarching summary metrics
  const overallPercentage = totalPossibleWeight > 0 
    ? Math.round((totalEarnedWeight / totalPossibleWeight) * 1000) / 10 
    : 0;
    
  // Keep totalScore and totalQuestions for backwards compatibility (total correct unweighted)
  const totalScoreLegacy = questionBreakdown.filter(q => q.isCorrect).length;

  return {
    totalScore: totalScoreLegacy, 
    totalQuestions,
    totalEarnedWeight,
    totalPossibleWeight,
    overallPercentage,
    classifiedTopics,
    questionBreakdown
  };
}
