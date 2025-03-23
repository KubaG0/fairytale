// fairytale-app-backend/src/services/fairytaleService.js

const Fairytale = require('../models/Fairytale');
const openRouterService = require('./openRouterService');
const elevenLabsService = require('./elevenLabsService');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Serwis koordynujący proces generowania bajki
 */
class FairytaleService {
  /**
   * Generuje bajkę na podstawie podanego ID
   * @param {string} fairytaleId - ID bajki do wygenerowania
   */
  async generateFairytale(fairytaleId) {
    try {
      logger.info(`Rozpoczęto generowanie bajki ID: ${fairytaleId}`);
      
      // Pobierz bajkę z bazy danych
      const fairytale = await Fairytale.findById(fairytaleId);
      if (!fairytale) {
        logger.error(`Nie znaleziono bajki o ID: ${fairytaleId}`);
        throw new Error('Nie znaleziono bajki');
      }
      
      // Generowanie tekstu bajki
      logger.info('Wysyłanie zapytania do API OpenRouter');
      const textContent = await openRouterService.generateText({
        description: fairytale.description,
        characters: fairytale.characters,
        duration: fairytale.duration
      });
      
      // Aktualizacja tekstu w bazie danych
      fairytale.textContent = textContent;
      await fairytale.save();
      logger.info(`Tekst bajki został zapisany dla ID: ${fairytaleId}`);
      logger.info('Otrzymano odpowiedź z API OpenRouter');
      
      try {
        // Konwersja tekstu na audio
        logger.info(`Rozpoczynam konwersję tekstu na audio dla bajki ID: ${fairytaleId}`);
        const audioUrl = await elevenLabsService.generateAudioFromText(textContent);
        
        // Sprawdź czy plik audio faktycznie istnieje
        const audioFilePath = path.join(__dirname, '../../public', audioUrl);
        if (!fs.existsSync(audioFilePath)) {
          logger.error(`Plik audio nie został utworzony: ${audioFilePath}`);
          throw new Error('Nie udało się utworzyć pliku audio');
        }
        
        // Aktualizacja statusu i URL audio
        fairytale.audioUrl = audioUrl;
        fairytale.status = 'completed';
        await fairytale.save();
        
        logger.info(`Status bajki ID: ${fairytaleId} zaktualizowany na 'completed'`);
        logger.info(`Bajka o ID: ${fairytaleId} została wygenerowana i skonwertowana na audio pomyślnie`);
        
        // Dodatkowa weryfikacja, czy status został faktycznie zapisany
        const updatedFairytale = await Fairytale.findById(fairytaleId);
        logger.info(`Stan bajki po pełnym wygenerowaniu: ${JSON.stringify({
          id: updatedFairytale._id,
          status: updatedFairytale.status,
          audioUrl: updatedFairytale.audioUrl ? 'exists' : 'missing'
        })}`);
        
      } catch (audioError) {
        logger.error(`Błąd podczas konwersji audio: ${audioError.message}`);
        
        // Zapisz bajkę bez audio
        fairytale.status = 'completed_no_audio';
        await fairytale.save();
        
        logger.info(`Status bajki ID: ${fairytaleId} zaktualizowany na 'completed_no_audio'`);
      }
    } catch (error) {
      logger.error(`Błąd podczas generowania bajki: ${error.message}`);
      if (error.response) {
        logger.error(`Szczegóły błędu API: ${JSON.stringify(error.response.data || {})}`);
      }
      
      try {
        // Aktualizacja statusu na "failed" w przypadku błędu
        const updatedFairytale = await Fairytale.findByIdAndUpdate(
          fairytaleId, 
          { status: 'failed' },
          { new: true }
        );
        
        if (updatedFairytale) {
          logger.info(`Status bajki ID: ${fairytaleId} zaktualizowany na 'failed'`);
        } else {
          logger.error(`Nie udało się zaktualizować statusu dla bajki ID: ${fairytaleId}`);
        }
      } catch (dbError) {
        logger.error(`Błąd podczas aktualizacji statusu bajki: ${dbError.message}`);
      }
    }
  }
  
  /**
   * Resetuje zawieszone bajki (pozostające w statusie 'generating' przez zbyt długi czas)
   */
  async resetStuckFairytales() {
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
      
      return stuckFairytales.length;
    } catch (error) {
      logger.error(`Błąd podczas resetowania zawieszonych bajek: ${error.message}`);
      return 0;
    }
  }
}

module.exports = new FairytaleService();