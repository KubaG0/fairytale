const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log dla developera
  logger.error(`${err.name}: ${err.message}`);
  
  // Błąd Mongoose - błędne ID
  if (err.name === 'CastError') {
    const message = 'Nie znaleziono zasobu';
    error = { message, statusCode: 404 };
  }
  
  // Błąd Mongoose - duplikat klucza
  if (err.code === 11000) {
    const message = 'Podana wartość już istnieje w systemie';
    error = { message, statusCode: 400 };
  }
  
  // Błąd Mongoose - walidacja
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Błąd serwera'
  });
};

module.exports = errorHandler;