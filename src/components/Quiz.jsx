import React, { useState } from 'react';

// Hard-coded quiz data
const javaQuizData = [
  {
    questionText: "What is the main method signature in Java?",
    answerOptions: [
      "public static void main(String[] args)",
      "public void main(String[] args)",
      "static void main(String[] args)",
      "public static main(String[] args)"
    ],
    correctAnswer: "public static void main(String[] args)"
  },
  {
    questionText: "Which of the following is NOT a primitive data type in Java?",
    answerOptions: [
      "int",
      "String",
      "boolean",
      "char"
    ],
    correctAnswer: "String"
  },
  {
    questionText: "What keyword is used to inherit a class in Java?",
    answerOptions: [
      "implements",
      "extends",
      "inherits",
      "super"
    ],
    correctAnswer: "extends"
  },
  {
    questionText: "Which access modifier provides the most restrictive access?",
    answerOptions: [
      "public",
      "protected",
      "default",
      "private"
    ],
    correctAnswer: "private"
  },
  {
    questionText: "What is the default value of a boolean variable in Java?",
    answerOptions: [
      "true",
      "false",
      "null",
      "0"
    ],
    correctAnswer: "false"
  }
];

const Quiz = ({ onQuizComplete }) => {
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Handle answer click logic
  const handleAnswerClick = (selectedAnswer) => {
    // Check if the selected answer is correct
    if (selectedAnswer === javaQuizData[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }

    // Check if this is the last question
    if (currentQuestionIndex < javaQuizData.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz is complete, call onQuizComplete with final score
      const finalScore = selectedAnswer === javaQuizData[currentQuestionIndex].correctAnswer ? score + 1 : score;
      onQuizComplete(finalScore);
    }
  };

  return (
    <div className="quiz-container">
      <p>Question {currentQuestionIndex + 1} / {javaQuizData.length}</p>
      
      <h2>{javaQuizData[currentQuestionIndex].questionText}</h2>
      
      <div className="answer-options">
        {javaQuizData[currentQuestionIndex].answerOptions.map((option, index) => (
          <button 
            key={index}
            onClick={() => handleAnswerClick(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Quiz;
