/**
 * Public Quiz Data - For Frontend Use Only
 * 
 * This file provides ONLY the safe version of quiz data (no correct answers)
 * Questions are fetched from the backend or hardcoded here without answers
 * 
 * SECURITY: This file should NEVER contain correct answers
 */

// Hardcoded questions without correct answers for frontend display
// In a production app, these would be fetched from the backend
export const questions = [
  {
    id: 'q1',
    order: 0,
    question: 'Which of the following is a JavaScript framework?',
    options: ['Django', 'React', 'Laravel', 'Rails'],
    topic: 'JavaScript Frameworks'
  },
  {
    id: 'q2',
    order: 1,
    question: 'What does CSS stand for?',
    options: [
      'Cascading Style Sheets',
      'Computer Style Sheets',
      'Creative Style System',
      'Colorful Style Sheets',
    ],
    topic: 'CSS Fundamentals'
  },
  {
    id: 'q3',
    order: 2,
    question: 'Which HTML tag is used for the largest heading?',
    options: ['<heading>', '<h6>', '<h1>', '<head>'],
    topic: 'HTML Elements'
  },
  {
    id: 'q4',
    order: 3,
    question: 'What is the correct way to declare a JavaScript variable?',
    options: [
      'variable myVar = 5;',
      'var myVar = 5;',
      'declare myVar = 5;',
      'v myVar = 5;'
    ],
    topic: 'JavaScript Syntax'
  },
  {
    id: 'q5',
    order: 4,
    question: 'Which of the following is NOT a valid CSS selector?',
    options: ['.class', '#id', '*element', 'element'],
    topic: 'CSS Selectors'
  },
  {
    id: 'q6',
    order: 5,
    question: 'What does DOM stand for in web development?',
    options: [
      'Document Object Model',
      'Data Object Management',
      'Dynamic Object Manipulation',
      'Document Oriented Model'
    ],
    topic: 'Web Development Concepts'
  },
  {
    id: 'q7',
    order: 6,
    question: 'Which HTTP method is typically used to retrieve data?',
    options: ['POST', 'PUT', 'GET', 'DELETE'],
    topic: 'HTTP Methods'
  },
  {
    id: 'q8',
    order: 7,
    question: 'What is the purpose of the "alt" attribute in HTML?',
    options: [
      'Alternative text for images',
      'Alignment of text',
      'Auto-loading of content',
      'Animation timing'
    ],
    topic: 'HTML Attributes'
  },
  {
    id: 'q9',
    order: 8,
    question: 'Which of the following is a CSS preprocessor?',
    options: ['Sass', 'jQuery', 'Bootstrap', 'Angular'],
    topic: 'CSS Tools'
  },
  {
    id: 'q10',
    order: 9,
    question: 'What is the correct way to comment in JavaScript?',
    options: [
      '<!-- comment -->',
      '/* comment */',
      '// comment',
      'Both B and C'
    ],
    topic: 'JavaScript Syntax'
  }
];

// Create a safe version of the quiz data
export const quizData = {
  id: 'web-development-basics',
  title: 'Web Development Fundamentals',
  description: 'Assess your knowledge across key web development topics',
  questions: questions
};

// Export a list of available quizzes (safe version)
export const publicQuizzes = [
  {
    id: 'web-development-basics',
    title: 'Web Development Fundamentals',
    description: 'Assess your knowledge across key web development topics',
    totalQuestions: questions.length
  }
];

export default { questions, quizData, publicQuizzes };
