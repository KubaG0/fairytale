const Fairytale = require('../models/Fairytale');
const logger = require('../utils/logger');
const { validateFairytaleInput } = require('../utils/validators');
const openRouterService = require('../services/openRouterService');
const path = require('path');
const fs = require('fs');

// Import serwisu ElevenLabs
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

// Asynchroniczne generowanie bajki - ZAKTUALIZOWANA FUNKCJA
const generateFairytaleAsync = async (fairytaleId) => {
  try {
    const fairytale = await Fairytale.findById(fairytaleId);
    if (!fairytale) {
      logger.error(`Nie znaleziono bajki o ID: ${fairytaleId}`);
      return;
    }

    logger.info(`Rozpoczęto generowanie bajki ID: ${fairytaleId}`);

    try {
      // 1. Generowanie tekstu bajki (OpenRouter)
      const textContent = await openRouterService.generateText({
        description: fairytale.description,
        characters: fairytale.characters,
        duration: fairytale.duration
      });

      // Weryfikacja tekstu bajki
      if (!textContent || textContent.trim().length < 50) {
        logger.error(`Wygenerowany tekst bajki jest zbyt krótki: "${textContent}"`);
        fairytale.status = 'failed';
        await fairytale.save();
        logger.info(`Status bajki ID: ${fairytaleId} zaktualizowany na 'failed' z powodu zbyt krótkiego tekstu`);
        return;
      }

      // Zapisz tekst do pliku dla celów debugowania
      const debugDir = path.join(__dirname, '../../public/debug');
      fs.mkdirSync(debugDir, { recursive: true });
      const debugFile = path.join(debugDir, `bajka_${fairytaleId}.txt`);
      fs.writeFileSync(debugFile, textContent);
      
      logger.info(`Wygenerowano tekst bajki o długości ${textContent.length} znaków`);
      logger.info(`Początek tekstu: "${textContent.substring(0, 100)}..."`);
      logger.info(`Zapisano pełny tekst bajki do: ${debugFile}`);

      // Aktualizacja tekstu w bazie
      fairytale.textContent = textContent;
      await fairytale.save();
      logger.info(`Tekst bajki został zapisany dla ID: ${fairytaleId}`);

      try {
        // 2. Konwersja tekstu na audio (ElevenLabs)
        logger.info(`Rozpoczynam konwersję tekstu na audio dla bajki ID: ${fairytaleId}`);
        const audioUrl = await generateAudioFromText(textContent);

        // Sprawdź czy plik audio istnieje i ma odpowiednią wielkość
        const audioFilePath = path.join(__dirname, '../../public', audioUrl);
        if (!fs.existsSync(audioFilePath)) {
          logger.error(`Plik audio nie został utworzony: ${audioFilePath}`);
          fairytale.status = 'completed_no_audio';
          await fairytale.save();
          logger.info(`Status bajki ID: ${fairytaleId} zaktualizowany na 'completed_no_audio'`);
          return;
        }

        // Sprawdź rozmiar pliku audio
        const stats = fs.statSync(audioFilePath);
        logger.info(`Rozmiar wygenerowanego pliku audio: ${stats.size} bajtów`);
        
        if (stats.size < 10000) { // Minimum 10KB dla poprawnego pliku audio
          logger.error(`Plik audio jest zbyt mały (${stats.size} bajtów), prawdopodobnie jest uszkodzony`);
          fairytale.status = 'completed_no_audio';
          await fairytale.save();
          logger.info(`Status bajki ID: ${fairytaleId} zaktualizowany na 'completed_no_audio' z powodu małego rozmiaru pliku`);
          return;
        }

        // 3. Aktualizacja rekordu bajki w bazie z audio
        fairytale.audioUrl = audioUrl;
        fairytale.status = 'completed';
        const saved = await fairytale.save();
        
        if (!saved) {
          logger.error(`Nie udało się zapisać bajki z ID: ${fairytaleId}`);
          return;
        }

        // Weryfikacja aktualizacji statusu
        const updatedFairytale = await Fairytale.findById(fairytaleId);
        logger.info(`Stan bajki po pełnym wygenerowaniu: Status=${updatedFairytale.status}, AudioUrl=${updatedFairytale.audioUrl ? 'exists' : 'missing'}, Rozmiar pliku=${stats.size} bajtów`);
        
        logger.info(`Bajka o ID: ${fairytaleId} została wygenerowana i skonwertowana na audio pomyślnie`);
      } catch (audioError) {
        logger.error(`Błąd podczas konwersji audio: ${audioError.message}`);
        logger.error(audioError.stack);
        
        // Zapisz bajkę bez audio
        fairytale.status = 'completed_no_audio';
        await fairytale.save();
        
        logger.info(`Status bajki ID: ${fairytaleId} zaktualizowany na 'completed_no_audio'`);
      }
    } catch (textError) {
      logger.error(`Błąd podczas generowania tekstu bajki: ${textError.message}`);
      logger.error(textError.stack);
      
      // Aktualizacja statusu na "failed" w przypadku błędu generowania tekstu
      fairytale.status = 'failed';
      await fairytale.save();
      
      logger.info(`Status bajki ID: ${fairytaleId} zaktualizowany na 'failed'`);
    }
  } catch (error) {
    logger.error(`Błąd w procesie generowania bajki: ${error.message}`);
    logger.error(error.stack);

    try {
      // Aktualizacja statusu w przypadku błędu
      const result = await Fairytale.findByIdAndUpdate(
        fairytaleId, 
        { status: 'failed' },
        { new: true }
      );
      
      if (result) {
        logger.info(`Status bajki ID: ${fairytaleId} zaktualizowany na 'failed'`);
      } else {
        logger.error(`Nie udało się zaktualizować statusu dla bajki ID: ${fairytaleId}`);
      }
    } catch (updateError) {
      logger.error(`Błąd podczas aktualizacji statusu bajki: ${updateError.message}`);
    }
  }
};

// @desc    Testowe generowanie audio z tekstu
// @route   POST /api/fairytales/test-audio
// @access  Private
exports.testAudioGeneration = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Tekst musi zawierać co najmniej 10 znaków'
      });
    }
    
    // Zapisz tekst do pliku dla celów debugowania
    const debugDir = path.join(__dirname, '../../public/debug');
    fs.mkdirSync(debugDir, { recursive: true });
    const debugFile = path.join(debugDir, `test_audio_${Date.now()}.txt`);
    fs.writeFileSync(debugFile, text);
    
    logger.info(`Testowanie generowania audio z tekstu o długości ${text.length} znaków`);
    logger.info(`Zapisano tekst testowy do: ${debugFile}`);
    
    // Generowanie audio
    const audioUrl = await generateAudioFromText(text);
    
    // Sprawdź czy plik audio istnieje i ma odpowiednią wielkość
    const audioFilePath = path.join(__dirname, '../../public', audioUrl);
    const stats = fs.statSync(audioFilePath);
    
    res.json({
      success: true,
      audioUrl,
      textLength: text.length,
      audioSize: stats.size,
      debugFileUrl: `/debug/${path.basename(debugFile)}`
    });
  } catch (error) {
    logger.error(`Błąd podczas testowania generowania audio: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Nie udało się wygenerować audio testowego'
    });
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

// @desc    Reset zawieszonych bajek
// @route   PUT /api/fairytales/reset-stuck
// @access  Private (Admin)
exports.resetStuckFairytales = async (req, res) => {
  try {
    // Znajdź bajki, które utknęły w statusie "generating" przez ponad 30 minut
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const stuckFairytales = await Fairytale.find({
      status: 'generating',
      createdAt: { $lt: thirtyMinutesAgo }
    });
    
    logger.info(`Znaleziono ${stuckFairytales.length} zawieszonych bajek`);
    
    // Aktualizuj status na "failed"
    for (const fairytale of stuckFairytales) {
      fairytale.status = 'failed';
      await fairytale.save();
      logger.info(`Zresetowano zawieszoną bajkę ID: ${fairytale._id}`);
    }
    
    res.status(200).json({
      success: true,
      count: stuckFairytales.length,
      message: `Zresetowano ${stuckFairytales.length} zawieszonych bajek`
    });
  } catch (error) {
    logger.error(`Błąd podczas resetowania zawieszonych bajek: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Nie udało się zresetować zawieszonych bajek'
    });
  }
};

// @desc    Regeneruj audio dla istniejącej bajki
// @route   PUT /api/fairytales/:id/regenerate-audio
// @access  Private
exports.regenerateAudio = async (req, res) => {
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
        message: 'Brak uprawnień do regeneracji audio dla tej bajki'
      });
    }

    // Sprawdź czy bajka ma tekst
    if (!fairytale.textContent) {
      return res.status(400).json({
        success: false,
        message: 'Bajka nie ma tekstu, który można przekonwertować na audio'
      });
    }

    // Usuń stary plik audio, jeśli istnieje
    if (fairytale.audioUrl) {
      const oldAudioPath = path.join(__dirname, '../../public', fairytale.audioUrl);
      if (fs.existsSync(oldAudioPath)) {
        fs.unlinkSync(oldAudioPath);
      }
    }

    // Ustaw status na "regenerating_audio"
    fairytale.status = 'regenerating_audio';
    await fairytale.save();

    // Asynchronicznie regeneruj audio
    regenerateAudioAsync(fairytale._id);

    res.status(200).json({
      success: true,
      message: 'Rozpoczęto regenerację audio dla bajki'
    });
  } catch (error) {
    logger.error(`Błąd podczas regeneracji audio: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Nie udało się rozpocząć regeneracji audio'
    });
  }
};

// Funkcja asynchroniczna do regeneracji audio
const regenerateAudioAsync = async (fairytaleId) => {
  try {
    const fairytale = await Fairytale.findById(fairytaleId);
    if (!fairytale || !fairytale.textContent) {
      logger.error(`Nie znaleziono bajki lub brak tekstu dla ID: ${fairytaleId}`);
      return;
    }

    logger.info(`Rozpoczynam regenerację audio dla bajki ID: ${fairytaleId}`);

    try {
      // Generowanie audio z istniejącego tekstu
      const audioUrl = await generateAudioFromText(fairytale.textContent);

      // Sprawdź czy plik audio istnieje i ma odpowiednią wielkość
      const audioFilePath = path.join(__dirname, '../../public', audioUrl);
      if (!fs.existsSync(audioFilePath)) {
        logger.error(`Plik audio nie został utworzony: ${audioFilePath}`);
        fairytale.status = 'completed_no_audio';
        await fairytale.save();
        return;
      }

      // Sprawdź rozmiar pliku audio
      const stats = fs.statSync(audioFilePath);
      if (stats.size < 10000) { // Minimum 10KB dla poprawnego pliku audio
        logger.error(`Plik audio jest zbyt mały (${stats.size} bajtów), prawdopodobnie jest uszkodzony`);
        fairytale.status = 'completed_no_audio';
        await fairytale.save();
        return;
      }

      // Aktualizacja bajki z nowym audio
      fairytale.audioUrl = audioUrl;
      fairytale.status = 'completed';
      await fairytale.save();

      logger.info(`Audio zostało pomyślnie zregenerowane dla bajki ID: ${fairytaleId}, rozmiar: ${stats.size} bajtów`);
    } catch (error) {
      logger.error(`Błąd podczas regeneracji audio: ${error.message}`);
      fairytale.status = 'completed_no_audio';
      await fairytale.save();
    }
  } catch (error) {
    logger.error(`Błąd w procesie regeneracji audio: ${error.message}`);
  }
};