/**
 * Logger utility for production-safe logging
 * Only logs debug/info messages in development, always logs errors/warnings
 */

const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Log debug information (development only)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log debug information (development only)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log informational messages (development only)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log warnings (always shown)
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Log errors (always shown)
   */
  error: (...args) => {
    console.error(...args);
  }
};

export default logger;
