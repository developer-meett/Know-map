import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration - update with your project details
const firebaseConfig = {
  apiKey: "AIzaSyBJh8F3l21SthZ7qfR0f3zbIu6wvI2UBII",
  authDomain: "knowmap-3114.firebaseapp.com",
  projectId: "knowmap-3114",
  storageBucket: "knowmap-3114.firebasestorage.app",
  messagingSenderId: "398547896862",
  appId: "1:398547896862:web:a5c9d1b8f8e5a4c9d7a3b2"
};

console.log('🔑 Using Firebase project:', firebaseConfig.projectId);

// Questions data - all 10 questions from questions.js
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
  },
  {
    id: 'q6',
    question: 'What does HTML stand for?',
    options: [
      'Hyper Text Markup Language',
      'High Tech Modern Language',
      'Home Tool Markup Language',
      'Hyperlink and Text Markup Language'
    ],
    correctAnswer: 0,
    topics: ['HTML Fundamentals']
  },
  {
    id: 'q7',
    question: 'Which method adds an element to the end of an array in JavaScript?',
    options: [
      'append()',
      'push()',
      'add()',
      'insert()'
    ],
    correctAnswer: 1,
    topics: ['JavaScript Methods']
  },
  {
    id: 'q8',
    question: 'What is the purpose of the <head> tag in HTML?',
    options: [
      'To create the main content area',
      'To define document metadata',
      'To create a navigation menu',
      'To add a title at the top of the page'
    ],
    correctAnswer: 1,
    topics: ['HTML Structure']
  },
  {
    id: 'q9',
    question: 'What is the result of 2 ** 3 in JavaScript?',
    options: ['5', '6', '8', '9'],
    correctAnswer: 2,
    topics: ['JavaScript Operators']
  },
  {
    id: 'q10',
    question: 'Which method converts a JSON string to a JavaScript object?',
    options: ['JSON.parse()', 'JSON.stringify()', 'Object.parse()', 'toJSON()'],
    correctAnswer: 0,
    topics: ['JavaScript JSON']
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
    
  } catch (error) {
    console.error('❌ Error setting up quiz data:', error);
  }
}

setupQuizData().then(() => {
  console.log("Setup complete");
  // Wait a bit before exiting to allow Firebase operations to complete
  setTimeout(() => {
    console.log("Exiting...");
    process.exit(0);
  }, 3000);
}).catch(err => {
  console.error("Setup error:", err);
  process.exit(1);
});
