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
    // Create a batch for atomic operations
    const batch = writeBatch(db);

    // 1. Create the main quiz document
    const quizRef = doc(db, 'quizzes', 'web-development-basics');
    batch.set(quizRef, {
      id: 'web-development-basics',
      title: 'Web Development Basics',
      description: 'Test your knowledge of HTML, CSS, and JavaScript fundamentals',
      totalQuestions: questions.length,
      topics: [...new Set(questions.map(q => q.topic))], // Unique topics
      createdAt: new Date(),
      version: '1.0'
    });

    console.log(`📝 Creating quiz: Web Development Basics`);

    // 2. Add each question as a separate document in a subcollection
    questions.forEach((question, index) => {
      const questionRef = doc(db, 'quizzes', 'web-development-basics', 'questions', question.id);
      
      batch.set(questionRef, {
        id: question.id,
        order: question.order,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer, // ⚠️ SENSITIVE: Only for backend
        topic: question.topic,
        difficulty: 'beginner', // You can add difficulty levels later
        createdAt: new Date()
      });

      console.log(`  ✅ Q${index + 1}: ${question.topic} - ${question.question.substring(0, 50)}...`);
    });

    // 3. Commit the batch
    await batch.commit();

    console.log('🎉 Quiz data setup completed successfully!');
    console.log(`� Added ${questions.length} questions across ${[...new Set(questions.map(q => q.topic))].length} topics:`);
    
    // Show topic summary
    const topicCounts = {};
    questions.forEach(q => {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    });

    Object.entries(topicCounts).forEach(([topic, count]) => {
      console.log(`  📚 ${topic}: ${count} questions`);
    });

    console.log('🔧 Next steps:');
    console.log('1. Deploy your Cloud Function: firebase deploy --only functions');
    console.log('2. Update .env.local with your function URL');
    console.log('3. Test the quiz in your application');

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
