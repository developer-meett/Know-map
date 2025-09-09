/**
 * Application constants
 * Centralized configuration values to avoid magic numbers and strings
 */

// UI Constants
export const TOAST_DURATION = 2600; // milliseconds
export const LOADING_DELAY = 300; // milliseconds

// Authentication Constants
export const MIN_PASSWORD_LENGTH = 6;
export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  requireUppercase: false, // Set to true if you want to enforce uppercase
  requireLowercase: false, // Set to true if you want to enforce lowercase
  requireNumbers: false, // Set to true if you want to enforce numbers
  requireSpecialChars: false // Set to true if you want to enforce special characters
};

// Quiz Constants
export const QUIZ_CONFIG = {
  DEFAULT_QUIZ_ID: 'web-development-basics',
  MASTERY_THRESHOLD: 0.8, // 80% for mastered
  REVISION_THRESHOLD: 0.5, // 50% for needs revision
  MAX_RETRIES: 3
};

// API Constants
export const API_TIMEOUTS = {
  DEFAULT: 10000, // 10 seconds
  UPLOAD: 30000, // 30 seconds
  LONG_RUNNING: 60000 // 60 seconds
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  QUIZ_SUBMIT_FAILED: 'Failed to submit quiz. Please try again.',
  QUIZ_LOAD_FAILED: 'Failed to load quiz. Please refresh the page.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  WEAK_PASSWORD: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  REQUIRED_FIELD: 'This field is required.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: 'Account created successfully!',
  SIGNED_IN: 'Successfully signed in!',
  QUIZ_SUBMITTED: 'Quiz submitted successfully!',
  OTP_SENT: 'OTP sent successfully!'
};

export default {
  TOAST_DURATION,
  LOADING_DELAY,
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
  QUIZ_CONFIG,
  API_TIMEOUTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
