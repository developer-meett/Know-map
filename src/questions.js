// Know-Map Quiz Data Structure
// This contains the questions shown to users (no correct answers exposed)

export const quizData = {
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
      correctAnswer: 0,
      topic: 'CSS Fundamentals'
    },
    {
      id: 'q3',
      order: 2,
      question: 'Which HTML tag is used for the largest heading?',
      options: ['<heading>', '<h6>', '<h1>', '<head>'],
      correctAnswer: 2,
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
      correctAnswer: 1,
      topic: 'JavaScript Fundamentals'
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
      topic: 'CSS Styling'
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
      topic: 'HTML Fundamentals'
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
      topic: 'JavaScript Methods'
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
      topic: 'HTML Structure'
    },
    {
      id: 'q9',
      order: 8,
      question: 'What is the result of 2 ** 3 in JavaScript?',
      options: ['5', '6', '8', '9'],
      correctAnswer: 2,
      topic: 'JavaScript Operators'
    },
    {
      id: 'q10',
      order: 9,
      question: 'Which method converts a JSON string to a JavaScript object?',
      options: ['JSON.parse()', 'JSON.stringify()', 'Object.parse()', 'toJSON()'],
      correctAnswer: 0,
      topic: 'JavaScript JSON'
    }
  ]
};

// Export individual questions for frontend display (without correct answers)
export const questions = quizData.questions.map(q => ({
  id: q.id,
  question: q.question,
  options: q.options,
  topic: q.topic
  // Note: correctAnswer is intentionally omitted for security
}));
