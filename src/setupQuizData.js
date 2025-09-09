import 'dotenv/config';
/**
 * Setup Quiz Data in Firestore
 * 
 * This script uploads quiz questions to Firestore database.
 * Run this once to populate your database with the quiz questions and answers.
 * 
 * IMPORTANT: This includes correct answers for backend grading.
 * Never expose this data structure to the frontend!
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { quizData } from './questions.js';

// Firebase configuration - update with your project details
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupQuizData() {
  console.log('🚀 Setting up quiz data in Firestore...');

  try {
    // Extract questions from imported quiz data
    const questions = quizData.questions;
    
    // 1. Create the main quiz document first
    const quizRef = doc(db, 'quizzes', 'web-development-basics');
    await setDoc(quizRef, {
      id: 'web-development-basics',
      title: 'Web Development Basics',
      description: 'Test your knowledge of HTML, CSS, and JavaScript fundamentals',
      totalQuestions: questions.length,
      topics: ['JavaScript Frameworks', 'CSS Fundamentals', 'HTML Elements', 'JavaScript Fundamentals', 'CSS Styling', 'HTML Fundamentals', 'JavaScript Methods', 'HTML Structure', 'JavaScript Operators', 'JavaScript JSON'],
      createdAt: new Date().toISOString(),
      version: '1.0'
    });

    console.log(`📝 Created quiz: Web Development Basics`);

    // 2. Add each question individually (instead of batch)
    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
      const questionRef = doc(db, 'quizzes', 'web-development-basics', 'questions', question.id);
      
      // Clean and validate the question data
      const cleanQuestionData = {
        id: String(question.id),
        order: Number(index),
        question: String(question.question),
        options: question.options.map(opt => String(opt)),
        correctAnswer: Number(question.correctAnswer),
        topic: String(question.topic),
        difficulty: 'beginner',
        createdAt: new Date().toISOString()
      };

      await setDoc(questionRef, cleanQuestionData);
      console.log(`  ✅ Q${index + 1}: ${cleanQuestionData.topic} - ${cleanQuestionData.question.substring(0, 50)}...`);
    }

    console.log('🎉 Quiz data setup completed successfully!');
    console.log(`📊 Added ${questions.length} questions across ${questions.length > 0 ? new Set(questions.map(q => q.topic)).size : 0} topics`);

    console.log('🔧 Next steps:');
    console.log('1. Deploy your Cloud Function: firebase deploy --only functions');
    console.log('2. Update .env with your function URL');
    console.log('3. Test the quiz in your application');

    // Print the Quiz ID for frontend configuration
    console.log(`\n🆔 QUIZ ID: web-development-basics`);
    console.log('👆 Copy this ID - you will need it for the .env configuration!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting up quiz data:', error);
    process.exit(1);
  }
}

// Check if running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  setupQuizData();
}
