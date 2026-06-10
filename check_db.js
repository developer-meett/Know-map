import mongoose from 'mongoose';
import Quiz from './server/models/Quiz.js';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/quiz-app');
  const quiz = await Quiz.findOne();
  console.log('Quiz title:', quiz.title);
  console.log('Question 0:', quiz.questions[0]);
  process.exit(0);
}
run();
