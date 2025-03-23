const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const logger = require('../utils/logger');

exports.protect = async (req, res, next) => {
  let token;
  
  // Sprawdź czy w nagłówku jest token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Sprawdź czy token istnieje
  if (!token) {
    logger.warn('Brak tokenu autoryzacyjnego');
    return res.status(401).json({
      success: false,
      message: 'Nie masz uprawnień do dostępu do tego zasobu'
    });
  }
  
  try {
    // Weryfikacja tokenu
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Pobierz użytkownika
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      logger.warn(`Nie znaleziono użytkownika z ID: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'Użytkownik nie istnieje'
      });
    }
    
    next();
  } catch (error) {
    logger.error(`Błąd autoryzacji: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Nie masz uprawnień do dostępu do tego zasobu'
    });
  }
};

// Middleware do ograniczenia dostępu do określonych ról
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Nie masz uprawnień do wykonania tej akcji'
      });
    }
    next();
  };
};