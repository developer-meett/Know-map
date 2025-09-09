/**
 * Master Quiz Data - Source of Truth
 * 
 * This file contains the complete quiz data with correct answers.
 * SECURITY WARNING: This file should never be directly imported in frontend code!
 */

export const quizMaster = {
  id: 'web-development-basics',
  title: 'Web Development Fundamentals',
  description: 'Assess your knowledge across key web development topics',
  questions: [
    {
      id: 'q1',
      order: 0,
      question: 'Which of the following is a JavaScript framework?',
      options: ['Django', 'React', 'Laravel', 'Rails'],
      correctAnswer: 1,
      topics: ['JavaScript Frameworks']
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
      correctAnswer: 0,
      topics: ['CSS Fundamentals']
    },
    {
      id: 'q3',
      order: 2,
      question: 'Which HTML tag is used for the largest heading?',
      options: ['<heading>', '<h6>', '<h1>', '<head>'],
      correctAnswer: 2,
      topics: ['HTML Elements']
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
      correctAnswer: 1,
      topics: ['JavaScript Fundamentals']
    },
    {
      id: 'q5',
      order: 4,
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
      order: 5,
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
      order: 6,
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
      order: 7,
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
      order: 8,
      question: 'What is the result of 2 ** 3 in JavaScript?',
      options: ['5', '6', '8', '9'],
      correctAnswer: 2,
      topics: ['JavaScript Operators']
    },
    {
      id: 'q10',
      order: 9,
      question: 'Which method converts a JSON string to a JavaScript object?',
      options: ['JSON.parse()', 'JSON.stringify()', 'Object.parse()', 'toJSON()'],
      correctAnswer: 0,
      topics: ['JavaScript JSON']
    }
  ]
};

// You can add additional quizzes here
export const allQuizzes = [quizMaster];
