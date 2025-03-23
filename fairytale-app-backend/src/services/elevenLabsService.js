// src/services/elevenLabsService.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;

// Przykładowa funkcja generująca audio z tekstu:
async function generateAudioFromText(text, voiceId = 'RWZoDXNWfWzwHbPcWFpP') {
  try {
    // Endpoint do generowania audio (zwraca binarny strumień MP3)
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    // Możemy ustawić dodatkowe parametry w body, np. 'stability', 'similarity_boost', 'voice_settings'
    const requestData = {
      text,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };

    // Robimy zapytanie POST z odpowiednimi nagłówkami
    const response = await axios({
      method: 'post',
      url,
      data: requestData,
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      responseType: 'arraybuffer', // kluczowe, bo otrzymujemy binarne dane audio
    });

    // Nazwa pliku MP3, np. 'audio_16794713.mp3'
    const filename = `audio_${Date.now()}.mp3`;
    const filePath = path.join(__dirname, '../../public/audio', filename);

    // Zapis do pliku
    fs.writeFileSync(filePath, response.data);

    // Zwróć ścieżkę lub URL do pliku (zależnie od Twojej struktury)
    return `/audio/${filename}`;
  } catch (error) {
    console.error('Błąd generowania audio w ElevenLabs:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  generateAudioFromText
};
