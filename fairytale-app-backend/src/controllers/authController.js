const User = require('../models/User');
const logger = require('../utils/logger');
const { validateEmail, validatePassword } = require('../utils/validators');

// @desc    Rejestracja użytkownika
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Sprawdź czy wszystkie pola są wypełnione
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane'
      });
    }

    // Walidacja emaila
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Podaj prawidłowy adres email'
      });
    }

    // Walidacja hasła
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Hasło musi mieć minimum 8 znaków, w tym co najmniej jedną literę i jedną cyfrę'
      });
    }

    // Sprawdź czy użytkownik już istnieje
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Użytkownik z podanym adresem email już istnieje'
      });
    }

    // Utwórz użytkownika
    const user = await User.create({
      name,
      email,
      password
    });

    // Wygeneruj token JWT
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logger.error(`Błąd rejestracji: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Nie udało się zarejestrować użytkownika'
    });
  }
};

// @desc    Logowanie użytkownika
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sprawdź czy email i hasło zostały podane
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email i hasło są wymagane'
      });
    }

    // Sprawdź czy użytkownik istnieje
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowe dane logowania'
      });
    }

    // Sprawdź czy hasło jest poprawne
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Nieprawidłowe dane logowania'
      });
    }

    // Wygeneruj token JWT
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logger.error(`Błąd logowania: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Nie udało się zalogować'
    });
  }
};

// @desc    Pobierz profil zalogowanego użytkownika
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error(`Błąd pobierania profilu: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać profilu użytkownika'
    });
  }
};