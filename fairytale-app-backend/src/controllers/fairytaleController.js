const Fairytale = require('../models/Fairytale');
const logger = require('../utils/logger');
const { validateFairytaleInput } = require('../utils/validators');
const huggingFaceService = require('../services/huggingFaceService');
const path = require('path');
const fs = require('fs');

// Import serwisu ElevenLabs (zakładam, że masz taki plik w /services)
const { generateAudioFromText } = require('../services/elevenLabsService');

// @desc    Generuj nową bajkę
// @route   POST /api/fairytales
// @access  Private
exports.generateFairytale = async (req, res) => {
  try {
    console.log('Otrzymane dane:', req.body);
    console.log('Użytkownik:', req.user);

    const { description, characters, duration } = req.body;

    // Walidacja danych wejściowych
    const validationResult = validateFairytaleInput(req.body);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message
      });
    }

    // Utwórz nowy rekord bajki
    const fairytale = await Fairytale.create({
      user: req.user.id,
      description,
      characters,
      duration,
      status: 'generating'
    });

    console.log('Utworzono nową bajkę:', fairytale);

    // Uruchom generowanie bajki asynchronicznie
    generateFairytaleAsync(fairytale._id);

    res.status(201).json({
      success: true,
      fairytale: {
        id: fairytale._id,
        status: fairytale.status
      },
      message: 'Rozpoczęto generowanie bajki'
    });
  } catch (error) {
    console.error('Błąd generowania bajki:', error);
    logger.error(`Błąd generowania bajki: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Nie udało się rozpocząć generowania bajki'
    });
  }
};

// Asynchroniczne generowanie bajki
const generateFairytaleAsync = async (fairytaleId) => {
  try {
    const fairytale = await Fairytale.findById(fairytaleId);
    if (!fairytale) {
      logger.error(`Nie znaleziono bajki o ID: ${fairytaleId}`);
      return;
    }

    logger.info(`Rozpoczęto generowanie bajki ID: ${fairytaleId}`);

    // 1. Generowanie tekstu bajki (Hugging Face)
    const textContent = await huggingFaceService.generateText({
      description: fairytale.description,
      characters: fairytale.characters,
      duration: fairytale.duration
    });

    // 2. Konwersja tekstu na audio (ElevenLabs)
    logger.info(`Rozpoczynam konwersję tekstu na audio dla bajki ID: ${fairytaleId}`);
    const audioUrl = await generateAudioFromText(textContent);

    // 3. Aktualizacja rekordu bajki w bazie
    fairytale.textContent = textContent;
    fairytale.audioUrl = audioUrl;
    fairytale.status = 'completed';
    await fairytale.save();

    logger.info(`Bajka o ID: ${fairytaleId} została wygenerowana i skonwertowana na audio pomyślnie`);
  } catch (error) {
    logger.error(`Błąd w procesie generowania bajki: ${error.message}`);

    // Aktualizacja statusu w przypadku błędu
    await Fairytale.findByIdAndUpdate(fairytaleId, { status: 'failed' });
  }
};

// @desc    Pobierz wszystkie bajki użytkownika
// @route   GET /api/fairytales
// @access  Private
exports.getFairytales = async (req, res) => {
  try {
    console.log('Pobieranie bajek dla użytkownika:', req.user.id);

    const fairytales = await Fairytale.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    console.log(`Znaleziono ${fairytales.length} bajek`);

    res.status(200).json({
      success: true,
      count: fairytales.length,
      data: fairytales
    });
  } catch (error) {
    console.error('Błąd pobierania bajek:', error);
    logger.error(`Błąd pobierania bajek: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać bajek'
    });
  }
};

// @desc    Pobierz szczegóły bajki
// @route   GET /api/fairytales/:id
// @access  Private
exports.getFairytale = async (req, res) => {
  try {
    const fairytale = await Fairytale.findById(req.params.id);

    if (!fairytale) {
      return res.status(404).json({
        success: false,
        message: 'Nie znaleziono bajki'
      });
    }

    // Sprawdź czy bajka należy do użytkownika
    if (fairytale.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Brak dostępu do tej bajki'
      });
    }

    res.status(200).json({
      success: true,
      data: fairytale
    });
  } catch (error) {
    logger.error(`Błąd pobierania szczegółów bajki: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać szczegółów bajki'
    });
  }
};

// @desc    Usuń bajkę
// @route   DELETE /api/fairytales/:id
// @access  Private
exports.deleteFairytale = async (req, res) => {
  try {
    console.log(`Próba usunięcia bajki o ID: ${req.params.id}`);

    const fairytale = await Fairytale.findById(req.params.id);

    if (!fairytale) {
      return res.status(404).json({
        success: false,
        message: 'Nie znaleziono bajki'
      });
    }

    // Sprawdź czy bajka należy do użytkownika
    if (fairytale.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do usunięcia tej bajki'
      });
    }

    // Usuń plik audio, jeśli istnieje
    if (fairytale.audioUrl) {
      const audioFilePath = path.join(__dirname, '../../public', fairytale.audioUrl);
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
      }
    }

    // Zamiast używać metody remove(), która może być przestarzała
    // Używamy metody deleteOne na modelu
    await Fairytale.deleteOne({ _id: fairytale._id });

    console.log(`Bajka o ID: ${req.params.id} została usunięta`);

    res.status(200).json({
      success: true,
      message: 'Bajka została usunięta'
    });
  } catch (error) {
    console.error('Błąd usuwania bajki:', error);
    logger.error(`Błąd usuwania bajki: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Nie udało się usunąć bajki'
    });
  }
};
