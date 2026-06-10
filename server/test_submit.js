import mongoose from 'mongoose';
import Quiz from './models/Quiz.js';
import { analyzeQuizPerformance } from './utils/quizAnalyzer.js';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/know-map');
  const quiz = await Quiz.findOne();
  
  const q = quiz.questions[0];
  const qid = (q._id && q._id.toString()) || q.id;
  
  const answers = { [qid]: 0 };
  const answeredKeys = Object.keys(answers);
  
  const dbQuestionsMap = {};
  quiz.questions.forEach(q => {
     const id = (q._id && q._id.toString()) || q.id;
     dbQuestionsMap[id] = q;
  });
  
  const questionsToGrade = answeredKeys.map(k => dbQuestionsMap[k]).filter(Boolean);
  
  const analysis = analyzeQuizPerformance(answers, questionsToGrade, {});
  console.log(JSON.stringify(analysis.questionBreakdown, null, 2));
  
  process.exit(0);
}
run();
