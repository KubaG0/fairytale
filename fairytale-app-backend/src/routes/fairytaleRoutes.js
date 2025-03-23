const express = require('express');
const router = express.Router();
const { 
  generateFairytale,
  getFairytales,
  getFairytale,
  deleteFairytale
} = require('../controllers/fairytaleController');
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(protect); // Wszystkie trasy wymagają autoryzacji

router.route('/')
  .post(apiLimiter, generateFairytale)
  .get(getFairytales);

router.route('/:id')
  .get(getFairytale)
  .delete(deleteFairytale);

module.exports = router;