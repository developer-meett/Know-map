#!/bin/bash
# Update Quiz Data in Firestore
# This script loads the questions from the master data file into Firestore

echo "🚀 Know-Map Quiz Data Updater"
echo "============================"

# Create the updater script
cat > temp-quiz-updater.mjs << 'EOL'
/**
 * Quiz Data Firestore Updater
 * 
 * This script updates the Firestore database with the quiz questions from quiz-master.js
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { quizMaster, allQuizzes } from './src/data/quiz-master.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJh8F3l21SthZ7qfR0f3zbIu6wvI2UBII",
  authDomain: "knowmap-3114.firebaseapp.com",
  projectId: "knowmap-3114",
  storageBucket: "knowmap-3114.firebasestorage.app",
  messagingSenderId: "398547896862",
  appId: "1:398547896862:web:a5c9d1b8f8e5a4c9d7a3b2"
};

console.log('🔑 Using Firebase project:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateQuizData() {
  console.log('🔄 Updating quiz data in Firestore...');
  
  try {
    // Update all quizzes in the database
    for (const quiz of allQuizzes) {
      console.log(`📝 Processing quiz: ${quiz.title} (${quiz.id})`);
      
      // Create the quiz document with all data
      const quizRef = doc(db, 'quizzes', quiz.id);
      await setDoc(quizRef, {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions, // Include all questions with correct answers
        totalQuestions: quiz.questions.length,
        updatedAt: new Date().toISOString(),
        version: '1.2'
      });
      
      console.log(`✅ Updated quiz: ${quiz.title} with ${quiz.questions.length} questions`);
    }
    
    console.log('🎉 Quiz data update completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error updating quiz data:', error);
    return false;
  }
}

// Run the update function
updateQuizData().then(success => {
  if (success) {
    console.log('👍 All quiz data has been updated in Firestore');
  } else {
    console.error('👎 Failed to update some quiz data');
  }
  
  // Wait for Firebase operations to complete
  setTimeout(() => {
    console.log('Exiting...');
    process.exit(success ? 0 : 1);
  }, 3000);
});
EOL

echo "⚙️ Running quiz updater..."
node temp-quiz-updater.mjs

# Check if the update was successful
if [ $? -eq 0 ]; then
  echo "🧹 Cleaning up temporary files..."
  rm temp-quiz-updater.mjs
  echo "✅ Quiz data has been successfully updated!"
  echo ""
  echo "📝 Future updates: Simply edit the quiz questions in src/data/quiz-master.js"
  echo "🔄 Then run this script again to update Firestore"
  exit 0
else
  echo "❌ Quiz update failed!"
  echo "🧹 Cleaning up temporary files..."
  rm temp-quiz-updater.mjs
  exit 1
fi
