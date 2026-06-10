import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import UserTopicProgress from '../models/UserTopicProgress.js';
import UserQuestionHistory from '../models/UserQuestionHistory.js';

export async function generateQuizForUser(userId, quizId, targetQuestionCount = 15) {
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    throw new Error('Quiz not found or has no questions.');
  }

  const allQuestions = [...quiz.questions];

  const previousAttempts = await QuizAttempt.countDocuments({ userId, quizId });
  const isFirstAttempt = previousAttempts === 0;

  const history = await UserQuestionHistory.find({ userId }).lean();
  const historyMap = {};
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const h of history) {
    historyMap[h.questionId] = new Date(h.answeredAt).getTime();
  }

  allQuestions.forEach(q => {
    const qid = q.id || q._id;
    const lastSeen = historyMap[qid];
    if (!lastSeen) q._priority = 1;
    else if (now - lastSeen > THIRTY_DAYS) q._priority = 2;
    else q._priority = 3;
    q._topicCategory = 'unknown'; 
  });

  if (isFirstAttempt || allQuestions.length <= targetQuestionCount) {
    allQuestions.sort(() => Math.random() - 0.5);
    allQuestions.sort((a, b) => a._priority - b._priority);
    const selected = allQuestions.slice(0, targetQuestionCount);
    return cleanAndShuffleQuestions(selected);
  }

  const topicProgress = await UserTopicProgress.find({ userId }).sort({ createdAt: -1 }).lean();
  
  const latestProgress = {};
  for (const tp of topicProgress) {
    if (!latestProgress[tp.topic]) latestProgress[tp.topic] = tp;
  }

  const weakTopics = [];
  const moderateTopics = [];
  const strongTopics = [];

  for (const [topic, data] of Object.entries(latestProgress)) {
    if (data.classification === 'Learn from Scratch') weakTopics.push(topic);
    else if (data.classification === 'Needs Revision') moderateTopics.push(topic);
    else strongTopics.push(topic);
  }

  allQuestions.forEach(q => {
    const topic = Array.isArray(q.topics) ? q.topics[0] : (q.topic || 'General');
    if (weakTopics.includes(topic)) q._topicCategory = 'weak';
    else if (moderateTopics.includes(topic)) q._topicCategory = 'moderate';
    else if (strongTopics.includes(topic)) q._topicCategory = 'strong';
    else q._topicCategory = 'unknown'; 
  });

  allQuestions.sort((a, b) => a._priority - b._priority);

  // 60% Weak, 25% Moderate, 15% Strong
  const quotas = {
    weak: Math.floor(targetQuestionCount * 0.60),
    moderate: Math.floor(targetQuestionCount * 0.25),
    strong: Math.floor(targetQuestionCount * 0.15)
  };
  
  quotas.strong += targetQuestionCount - (quotas.weak + quotas.moderate + quotas.strong);

  const selectedQuestions = [];
  const counts = { weak: 0, moderate: 0, strong: 0 };

  const pick = (category, limit) => {
    for (let i = 0; i < allQuestions.length && counts[category] < limit; i++) {
      const q = allQuestions[i];
      if (!q._selected && (q._topicCategory === category || (category === 'strong' && q._topicCategory === 'unknown'))) {
        selectedQuestions.push(q);
        q._selected = true;
        counts[category]++;
      }
    }
  };

  pick('weak', quotas.weak);
  pick('moderate', quotas.moderate);
  pick('strong', quotas.strong);

  for (let i = 0; i < allQuestions.length && selectedQuestions.length < targetQuestionCount; i++) {
    if (!allQuestions[i]._selected) {
      selectedQuestions.push(allQuestions[i]);
      allQuestions[i]._selected = true;
    }
  }

  return cleanAndShuffleQuestions(selectedQuestions);
}

export function cleanAndShuffleQuestions(questions) {
  return questions.map(q => {
    const cleanQ = { ...q };
    delete cleanQ._priority;
    delete cleanQ._topicCategory;
    delete cleanQ._selected;
    
    // We CANNOT shuffle options on the backend without breaking grading
    // because the backend analyzer expects the answer index to match the DB array index.
    
    return cleanQ;
  }).sort(() => Math.random() - 0.5);
}
