const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  HUGGING_FACE_API_KEY: process.env.HUGGING_FACE_API_KEY,
  GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN
};