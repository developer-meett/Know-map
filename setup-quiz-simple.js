import 'dotenv/config';
/**
 * Alternative Quiz Data Setup - Simple Approach
 * This bypasses potential Firestore write issues by using a simpler data structure
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration
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

// Hardcoded quiz data to avoid import issues
const simpleQuizData = {
  id: 'web-development-basics',
  title: 'Web Development Basics',
  description: 'Test your knowledge of HTML, CSS, and JavaScript fundamentals',
  totalQuestions: 10,
  topics: ['JavaScript', 'CSS', 'HTML'],
  questions: [
    {
      id: 'q1',
      question: 'Which of the following is a JavaScript framework?',
      options: ['Django', 'React', 'Laravel', 'Rails'],
      correctAnswer: 1,
      topic: 'JavaScript'
    },
    {
      id: 'q2',
      question: 'What does CSS stand for?',
      options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style System', 'Colorful Style Sheets'],
      correctAnswer: 0,
      topic: 'CSS'
    },
    {
      id: 'q3',
      question: 'Which HTML tag is used for the largest heading?',
      options: ['<h6>', '<h1>', '<header>', '<heading>'],
      correctAnswer: 1,
      topic: 'HTML'
    },
    {
      id: 'q4',
      question: 'What is the correct way to declare a JavaScript variable?',
      options: ['var myVar;', 'variable myVar;', 'v myVar;', 'declare myVar;'],
      correctAnswer: 0,
      topic: 'JavaScript'
    },
    {
      id: 'q5',
      question: 'Which CSS property is used to change the text color?',
      options: ['font-color', 'text-color', 'color', 'foreground-color'],
      correctAnswer: 2,
      topic: 'CSS'
    },
    {
      id: 'q6',
      question: 'What does HTML stand for?',
      options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink and Text Markup Language'],
      correctAnswer: 0,
      topic: 'HTML'
    },
    {
      id: 'q7',
      question: 'Which method adds an element to the end of an array in JavaScript?',
      options: ['append()', 'push()', 'add()', 'insert()'],
      correctAnswer: 1,
      topic: 'JavaScript'
    },
    {
      id: 'q8',
      question: 'What is the purpose of the head tag in HTML?',
      options: ['To create the main content area', 'To define document metadata', 'To create a navigation menu', 'To add a title at the top of the page'],
      correctAnswer: 1,
      topic: 'HTML'
    },
    {
      id: 'q9',
      question: 'What is the result of 2 ** 3 in JavaScript?',
      options: ['5', '6', '8', '9'],
      correctAnswer: 2,
      topic: 'JavaScript'
    },
    {
      id: 'q10',
      question: 'Which method converts a JSON string to a JavaScript object?',
      options: ['JSON.parse()', 'JSON.stringify()', 'JSON.convert()', 'JSON.object()'],
      correctAnswer: 0,
      topic: 'JavaScript'
    }
  ]
};

async function setupSimpleQuizData() {
  console.log('🚀 Setting up quiz data in Firestore (Simple approach)...');

  try {
    // Create the main quiz document with embedded questions
    const quizRef = doc(db, 'quizzes', 'web-development-basics');
    await setDoc(quizRef, {
      ...simpleQuizData,
      createdAt: new Date().toISOString(),
      version: '1.0'
    });

    console.log('✅ Quiz data setup completed successfully!');
    console.log(`📊 Added quiz with ${simpleQuizData.questions.length} questions`);
    
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

// Run the setup
setupSimpleQuizData();
