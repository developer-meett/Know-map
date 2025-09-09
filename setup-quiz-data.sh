#!/bin/bash
# Firebase Quiz Data Setup Script

echo "🔄 Quiz Data Setup Script"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required but not installed."
    exit 1
fi

# Create a temporary JavaScript file
echo "📝 Creating temporary script..."

cat > temp-quiz-setup.js << 'EOL'
// Quiz Data Setup Script
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('🔑 Using Firebase project:', process.env.VITE_FIREBASE_PROJECT_ID);

// Questions data
const questions = [
  {
    id: 'q1',
    question: 'Which of the following is a JavaScript framework?',
    options: ['Django', 'React', 'Laravel', 'Rails'],
    correctAnswer: 1,
    topics: ['JavaScript Frameworks']
  },
  {
    id: 'q2',
    question: 'What does CSS stand for?',
    options: [
      'Cascading Style Sheets',
      'Computer Style Sheets',
      'Creative Style System',
      'Colorful Style Sheets',
    ],
    correctAnswer: 0,
    topics: ['CSS Fundamentals']
  },
  {
    id: 'q3',
    question: 'Which HTML tag is used for the largest heading?',
    options: ['<heading>', '<h6>', '<h1>', '<head>'],
    correctAnswer: 2,
    topics: ['HTML Elements']
  },
  {
    id: 'q4',
    question: 'What is the correct way to declare a JavaScript variable?',
    options: [
      'variable myVar = 5;',
      'var myVar = 5;',
      'declare myVar = 5;',
      'v myVar = 5;'
    ],
    correctAnswer: 1,
    topics: ['JavaScript Fundamentals']
  },
  {
    id: 'q5',
    question: 'Which CSS property is used to change the text color?',
    options: [
      'font-color',
      'text-color',
      'color',
      'foreground-color'
    ],
    correctAnswer: 2,
    topics: ['CSS Styling']
  }
];

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupQuizData() {
  console.log('🚀 Setting up quiz data in the format expected by the backend...');

  try {
    // Create the quiz document with the questions array directly
    // This matches the format expected by our backend
    const quizRef = doc(db, 'quizzes', 'web-development-basics');
    await setDoc(quizRef, {
      id: 'web-development-basics',
      title: 'Web Development Basics',
      description: 'Test your knowledge of web development fundamentals',
      questions: questions, // Include the questions array directly in the document
      totalQuestions: questions.length,
      createdAt: new Date().toISOString(),
      version: '1.1'
    });

    console.log(`✅ Created quiz document with embedded questions array`);
    console.log(`📊 Added ${questions.length} questions to the quiz document`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up quiz data:', error);
    process.exit(1);
  }
}

setupQuizData();
EOL

echo "⚙️ Running setup script..."
node --experimental-modules temp-quiz-setup.js

# Check if the script was successful
if [ $? -eq 0 ]; then
    echo "🎉 Quiz data setup completed successfully!"
    echo "🧹 Cleaning up temporary files..."
    rm temp-quiz-setup.js
    exit 0
else
    echo "❌ Quiz data setup failed!"
    echo "🧹 Cleaning up temporary files..."
    rm temp-quiz-setup.js
    exit 1
fi
