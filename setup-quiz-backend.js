/**
 * Setup Quconst firebaseConfig = {
  apiKey: "AIzaSyCm3jujxQ5U7NAQDthGUpMfeqNZ_lVm9f8",
  authDomain: "knowmap-3114.firebaseapp.com",
  projectId: "knowmap-3114",
  storageBucket: "knowmap-3114.firebasestorage.app",
  messagingSenderId: "988104472638",
  appId: "1:988104472638:web:4eb100d8f00cd5793e396f"
};in Firestore - Updated for Backend Integration
 * 
 * This script uploads quiz questions to Firestore database in the format
 * expected by the Python Flask backend.
 * 
 * IMPORTANT: This includes correct answers for backend grading.
 * Never expose this data structure to the frontend!
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { quizData } from './src/questions.js';

// Firebase configuration - from .env.local
const firebaseConfig = {
  apiKey: "AIzaSyCm3jujxQ5U7NAQDthGUpMfeqNZ_lVm9f8",
  authDomain: "knowmap-3114.firebaseapp.com",
  projectId: "knowmap-3114",
  storageBucket: "knowmap-3114.firebasestorage.app",
  messagingSenderId: "988104472638",
  appId: "1:988104472638:web:4eb100d8f00cd5793e396f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupQuizDataForBackend() {
  console.log('🚀 Setting up quiz data in Firestore for backend...');
  console.log(`Database Project: ${firebaseConfig.projectId}`);

  try {
    // Transform questions to match backend expectations
    const questionsForBackend = quizData.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correct: q.correctAnswer, // Backend expects 'correct' not 'correctAnswer'
      topics: [q.topic], // Backend expects 'topics' array
      order: q.order
    }));

    // Create the quiz document with questions array (as expected by backend)
    const quizDocument = {
      id: quizData.id,
      title: quizData.title,
      description: quizData.description,
      questions: questionsForBackend, // All questions in the main document
      totalQuestions: questionsForBackend.length,
      topics: [...new Set(quizData.questions.map(q => q.topic))], // Unique topics
      createdAt: new Date(),
      version: '1.0',
      active: true
    };

    // Save to Firestore
    await setDoc(doc(db, 'quizzes', quizData.id), quizDocument);

    console.log('🎉 Quiz data setup completed successfully!');
    console.log(`🏆 Quiz ID: ${quizData.id}`);
    console.log(`📊 Questions: ${questionsForBackend.length}`);
    
    // Show topic summary
    const topicCounts = {};
    quizData.questions.forEach(q => {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    });

    console.log('📚 Topics breakdown:');
    Object.entries(topicCounts).forEach(([topic, count]) => {
      console.log(`  • ${topic}: ${count} questions`);
    });

    console.log('\n✅ Backend is ready! Function URL:');
    console.log('   https://us-central1-knowmap-3114.cloudfunctions.net/know_map_api');
    console.log('\n🔧 Next steps:');
    console.log('1. Test the backend: npm run dev');
    console.log('2. Try submitting a quiz to see the Know-Map analysis!');

  } catch (error) {
    console.error('❌ Error setting up quiz data:', error);
    process.exit(1);
  }
}

// Run the setup
setupQuizDataForBackend();
