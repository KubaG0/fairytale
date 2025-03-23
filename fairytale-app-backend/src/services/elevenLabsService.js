// src/services/elevenLabsService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Generuje plik audio na podstawie tekstu przy użyciu ElevenLabs API
 * 
 * @param {string} text - Tekst do konwersji na mowę
 * @returns {Promise<string>} - Ścieżka do wygenerowanego pliku audio
 */
const generateAudioFromText = async (text) => {
  try {
    logger.info(`Rozpoczynam generowanie audio z tekstu o długości ${text.length} znaków`);
    
    // Pobierz parametry z zmiennych środowiskowych
    const voiceId = process.env.ELEVEN_LABS_VOICE_ID;
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const modelId = process.env.ELEVEN_LABS_MODEL || 'eleven_multilingual_v2';
    
    if (!apiKey) {
      throw new Error('Brak klucza API dla ElevenLabs');
    }
    
    if (!voiceId) {
      throw new Error('Brak ID głosu dla ElevenLabs');
    }
    
    // Parametry głosu
    const voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 0.48,
      use_speaker_boost: true
    };
    
    logger.info(`Wywołuję ElevenLabs API z głosem ID: ${voiceId} i modelem: ${modelId}`);
    
    // Wywołanie API ElevenLabs
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      data: {
        text: text,
        model_id: modelId,
        voice_settings: voiceSettings
      },
      responseType: 'arraybuffer'
    });
    
    // Utwórz katalog na pliki audio, jeśli nie istnieje
    const audioDir = path.join(__dirname, '../../public/audio');
    fs.mkdirSync(audioDir, { recursive: true });
    
    // Nazwa pliku audio z unikalnym timestampem
    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);
    
    // Zapisz plik audio
    fs.writeFileSync(filePath, response.data);
    
    // Sprawdź rozmiar pliku
    const stats = fs.statSync(filePath);
    logger.info(`Zapisano plik audio: ${filePath}, rozmiar: ${stats.size} bajtów`);
    
    if (stats.size < 10000) { // Sprawdź czy plik nie jest za mały
      logger.warn(`Plik audio jest podejrzanie mały: ${stats.size} bajtów, możliwe problemy z generowaniem`);
    }
    
    // Zwróć relatywną ścieżkę do pliku audio (do użycia w URL)
    return `/audio/${fileName}`;
    
  } catch (error) {
    logger.error(`Błąd podczas generowania audio: ${error.message}`);
    if (error.response) {
      logger.error(`Status: ${error.response.status}, Dane: ${JSON.stringify(error.response.data)}`);
    }
    
    // Próba użycia alternatywnego głosu, jeśli pierwszy zawiódł
    try {
      return await generateAudioWithFallbackVoice(text);
    } catch (fallbackError) {
      logger.error(`Również alternatywny głos zawiódł: ${fallbackError.message}`);
      throw new Error('Nie udało się wygenerować audio. Spróbuj ponownie później.');
    }
  }
};

/**
 * Generuje audio używając alternatywnego głosu w przypadku problemów z głównym
 * @private
 */
const generateAudioWithFallbackVoice = async (text) => {
  logger.info(`Próba z alternatywnym głosem (fallback)`);
  
  try {
    // Pobierz parametry z zmiennych środowiskowych
    const fallbackVoiceId = process.env.ELEVEN_LABS_FALLBACK_VOICE_ID;
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const modelId = process.env.ELEVEN_LABS_MODEL || 'eleven_multilingual_v2';
    
    if (!fallbackVoiceId) {
      throw new Error('Brak ID głosu zapasowego dla ElevenLabs');
    }
    
    // Wywołanie API z alternatywnym głosem
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${fallbackVoiceId}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      data: {
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      },
      responseType: 'arraybuffer'
    });
    
    // Utwórz katalog na pliki audio, jeśli nie istnieje
    const audioDir = path.join(__dirname, '../../public/audio');
    fs.mkdirSync(audioDir, { recursive: true });
    
    // Nazwa pliku audio z unikalnym timestampem
    const fileName = `audio_fallback_${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);
    
    // Zapisz plik audio
    fs.writeFileSync(filePath, response.data);
    
    logger.info(`Zapisano plik audio (fallback): ${filePath}`);
    
    // Zwróć relatywną ścieżkę do pliku audio
    return `/audio/${fileName}`;
    
  } catch (error) {
    logger.error(`Błąd podczas generowania audio (fallback): ${error.message}`);
    throw error;
  }
};

module.exports = {
  generateAudioFromText
};