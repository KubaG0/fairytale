const config = require('../config/env');

const logger = {
  info: (message) => {
    console.log(`[INFO] ${message}`);
  },
  error: (message) => {
    console.error(`[ERROR] ${message}`);
    
    // W przyszłości można tu zintegrować Sentry
    // if (config.NODE_ENV === 'production' && config.SENTRY_DSN) {
    //   Sentry.captureException(message);
    // }
  },
  warn: (message) => {
    console.warn(`[WARN] ${message}`);
  },
  debug: (message) => {
    if (config.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`);
    }
  }
};

module.exports = logger;