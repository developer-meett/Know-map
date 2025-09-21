/**
 * JSON Validation Utility for Quiz Import
 * 
 * This utility validates uploaded JSON files to ensure they meet our quiz format requirements
 * Used for bulk question import functionality in the admin dashboard
 */

export class JSONValidationError extends Error {
  constructor(message, field = null, lineNumber = null) {
    super(message);
    this.name = 'JSONValidationError';
    this.field = field;
    this.lineNumber = lineNumber;
  }
}

export class QuizJSONValidator {
  
  /**
   * Main validation method - validates complete quiz JSON structure
   * @param {Object} jsonData - Parsed JSON object to validate
   * @returns {Object} - Validation result with success status and details
   */
  static validateQuizJSON(jsonData) {
    const errors = [];
    const warnings = [];
    
    try {
      // Step 1: Basic structure validation
      this.validateBasicStructure(jsonData, errors);
      
      // Step 2: Quiz metadata validation
      this.validateQuizMetadata(jsonData, errors, warnings);
      
      // Step 3: Questions array validation
      this.validateQuestions(jsonData.questions || [], errors, warnings);
      
      // Step 4: Business rules validation
      this.validateBusinessRules(jsonData, errors, warnings);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        questionCount: jsonData.questions ? jsonData.questions.length : 0,
        summary: this.generateValidationSummary(jsonData, errors, warnings)
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Critical validation error: ${error.message}`],
        warnings: [],
        questionCount: 0,
        summary: 'Validation failed due to critical error'
      };
    }
  }
  
  /**
   * Validates the basic JSON structure
   */
  static validateBasicStructure(jsonData, errors) {
    if (!jsonData || typeof jsonData !== 'object') {
      errors.push('Invalid JSON: Root must be an object');
      return;
    }
    
    if (Array.isArray(jsonData)) {
      errors.push('Invalid JSON: Root cannot be an array. Expected an object with title, description, and questions');
      return;
    }
    
    if (!jsonData.questions) {
      errors.push('Missing required field: "questions" array');
      return;
    }
    
    if (!Array.isArray(jsonData.questions)) {
      errors.push('Invalid field: "questions" must be an array');
    }
  }
  
  /**
   * Validates quiz metadata (title, description)
   */
  static validateQuizMetadata(jsonData, errors, warnings) {
    // Title validation
    if (!jsonData.title) {
      warnings.push('Missing quiz title - will use default title');
    } else if (typeof jsonData.title !== 'string') {
      errors.push('Quiz title must be a string');
    } else if (jsonData.title.trim().length === 0) {
      warnings.push('Empty quiz title - will use default title');
    } else if (jsonData.title.length > 100) {
      warnings.push('Quiz title is very long (>100 characters)');
    }
    
    // Description validation
    if (!jsonData.description) {
      warnings.push('Missing quiz description - will use default description');
    } else if (typeof jsonData.description !== 'string') {
      errors.push('Quiz description must be a string');
    } else if (jsonData.description.length > 500) {
      warnings.push('Quiz description is very long (>500 characters)');
    }
  }
  
  /**
   * Validates the questions array and individual questions
   */
  static validateQuestions(questions, errors, warnings) {
    if (questions.length === 0) {
      errors.push('No questions found - quiz must have at least one question');
      return;
    }
    
    if (questions.length > 100) {
      warnings.push(`Large number of questions (${questions.length}) - consider splitting into multiple quizzes`);
    }
    
    // Validate each question
    questions.forEach((question, index) => {
      this.validateSingleQuestion(question, index, errors, warnings);
    });
    
    // Check for duplicate questions
    this.checkForDuplicateQuestions(questions, warnings);
  }
  
  /**
   * Validates a single question object
   */
  static validateSingleQuestion(question, index, errors, warnings) {
    const questionNumber = index + 1;
    const prefix = `Question ${questionNumber}:`;
    
    // Check if question is an object
    if (!question || typeof question !== 'object') {
      errors.push(`${prefix} Must be an object`);
      return;
    }
    
    // Validate question text
    if (!question.question) {
      errors.push(`${prefix} Missing "question" field`);
    } else if (typeof question.question !== 'string') {
      errors.push(`${prefix} Question text must be a string`);
    } else if (question.question.trim().length === 0) {
      errors.push(`${prefix} Question text cannot be empty`);
    } else if (question.question.length > 500) {
      warnings.push(`${prefix} Question text is very long (>500 characters)`);
    }
    
    // Validate options array
    if (!question.options) {
      errors.push(`${prefix} Missing "options" field`);
    } else if (!Array.isArray(question.options)) {
      errors.push(`${prefix} Options must be an array`);
    } else {
      this.validateQuestionOptions(question.options, questionNumber, errors, warnings);
    }
    
    // Validate correct answer
    if (question.correct === undefined || question.correct === null) {
      errors.push(`${prefix} Missing "correct" field`);
    } else if (!Number.isInteger(question.correct)) {
      errors.push(`${prefix} Correct answer must be an integer`);
    } else if (question.options && (question.correct < 0 || question.correct >= question.options.length)) {
      errors.push(`${prefix} Correct answer index (${question.correct}) is out of range`);
    }
    
    // Validate topic (optional but recommended)
    if (!question.topic) {
      warnings.push(`${prefix} Missing topic - will be assigned "General"`);
    } else if (typeof question.topic !== 'string') {
      errors.push(`${prefix} Topic must be a string`);
    } else if (question.topic.trim().length === 0) {
      warnings.push(`${prefix} Empty topic - will be assigned "General"`);
    }
    
    // Validate optional ID field
    if (question.id && typeof question.id !== 'string') {
      errors.push(`${prefix} ID must be a string if provided`);
    }
  }
  
  /**
   * Validates question options array
   */
  static validateQuestionOptions(options, questionNumber, errors, warnings) {
    const prefix = `Question ${questionNumber}:`;
    
    if (options.length < 2) {
      errors.push(`${prefix} Must have at least 2 options`);
    } else if (options.length > 6) {
      warnings.push(`${prefix} Has many options (${options.length}) - consider reducing for better UX`);
    }
    
    options.forEach((option, optionIndex) => {
      if (typeof option !== 'string') {
        errors.push(`${prefix} Option ${optionIndex + 1} must be a string`);
      } else if (option.trim().length === 0) {
        errors.push(`${prefix} Option ${optionIndex + 1} cannot be empty`);
      } else if (option.length > 200) {
        warnings.push(`${prefix} Option ${optionIndex + 1} is very long (>200 characters)`);
      }
    });
    
    // Check for duplicate options
    const uniqueOptions = new Set(options.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      warnings.push(`${prefix} Has duplicate or very similar options`);
    }
  }
  
  /**
   * Validates business rules and constraints
   */
  static validateBusinessRules(jsonData, errors, warnings) {
    // Check if all questions have the same number of options
    if (jsonData.questions && jsonData.questions.length > 1) {
      const optionCounts = jsonData.questions.map(q => q.options ? q.options.length : 0);
      const uniqueCounts = new Set(optionCounts);
      
      if (uniqueCounts.size > 1) {
        warnings.push('Questions have different numbers of options - this may affect quiz consistency');
      }
    }
    
    // Check topic distribution
    if (jsonData.questions) {
      const topics = jsonData.questions.map(q => q.topic || 'General');
      const topicCounts = {};
      topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
      
      if (Object.keys(topicCounts).length === 1) {
        warnings.push('All questions have the same topic - consider adding variety');
      }
    }
  }
  
  /**
   * Checks for duplicate questions
   */
  static checkForDuplicateQuestions(questions, warnings) {
    const questionTexts = questions.map(q => q.question ? q.question.trim().toLowerCase() : '');
    const uniqueTexts = new Set(questionTexts);
    
    if (uniqueTexts.size !== questions.length) {
      warnings.push('Duplicate or very similar questions detected');
    }
  }
  
  /**
   * Generates a human-readable validation summary
   */
  static generateValidationSummary(jsonData, errors, warnings) {
    const questionCount = jsonData.questions ? jsonData.questions.length : 0;
    const title = jsonData.title || 'Untitled Quiz';
    
    let summary = `Quiz: "${title}" with ${questionCount} question${questionCount !== 1 ? 's' : ''}`;
    
    if (errors.length > 0) {
      summary += ` - ${errors.length} error${errors.length !== 1 ? 's' : ''} found`;
    }
    
    if (warnings.length > 0) {
      summary += ` - ${warnings.length} warning${warnings.length !== 1 ? 's' : ''} found`;
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      summary += ' - Ready to import';
    }
    
    return summary;
  }
  
  /**
   * Validates file before parsing JSON
   */
  static validateFile(file) {
    const errors = [];
    
    // Check file type
    if (!file.type || file.type !== 'application/json') {
      if (!file.name.endsWith('.json')) {
        errors.push('File must be a JSON file (.json extension)');
      }
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('File size too large (max 5MB allowed)');
    }
    
    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export default validator for convenience
export default QuizJSONValidator;