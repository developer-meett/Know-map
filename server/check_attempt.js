import mongoose from 'mongoose';
import QuizAttempt from './models/QuizAttempt.js';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/know-map');
  const attempt = await QuizAttempt.findOne().sort({ completedAt: -1 });
  console.log(JSON.stringify(attempt.questionBreakdown[0], null, 2));
  process.exit(0);
}
run();
