const axios = require('axios');
const fs = require('fs');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Serwis do konwersji tekstu na mowę przy użyciu Google Text-to-Speech API
 */
const generateAudio = async (text, outputPath) => {
  try {
    // Podziel tekst na mniejsze fragmenty, jeśli jest zbyt długi
    // Google TTS ma limit 5000 znaków na zapytanie
    const textChunks = splitTextIntoChunks(text, 4800);
    
    let audioBuffers = [];
    
    // Generuj audio dla każdego fragmentu
    for (const chunk of textChunks) {
      const audioBuffer = await synthesizeSpeech(chunk);
      audioBuffers.push(audioBuffer);
    }
    
    // Połącz wszystkie bufory audio w jeden plik
    const combinedBuffer = Buffer.concat(audioBuffers);
    
    // Zapisz plik audio
    fs.writeFileSync(outputPath, combinedBuffer);
    
    logger.info(`Plik audio zapisany w: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    logger.error(`Błąd generowania audio: ${error.message}`);
    throw new Error('Nie udało się wygenerować pliku audio');
  }
};

/**
 * Wywołanie Google Text-to-Speech API
 */
const synthesizeSpeech = async (text) => {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://texttospeech.googleapis.com/v1/text:synthesize',
      params: {
        key: config.GOOGLE_TTS_API_KEY
      },
      data: {
        input: { text },
        voice: {
          languageCode: 'pl-PL',
          name: 'pl-PL-Wavenet-B',
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0,
          speakingRate: 0.9
        }
      }
    });
    
    // Dekoduj base64 na buffer
    return Buffer.from(response.data.audioContent, 'base64');
  } catch (error) {
    logger.error(`Błąd wywołania Google TTS API: ${error.message}`);
    throw error;
  }
};

/**
 * Dzieli tekst na mniejsze fragmenty
 */
const splitTextIntoChunks = (text, maxChunkSize) => {
  const chunks = [];
  
  // Dziel tekst po kropkach, aby zachować strukturę zdania
  const sentences = text.split('. ');
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const potentialChunk = currentChunk ? `${currentChunk}. ${sentence}` : sentence;
    
    if (potentialChunk.length <= maxChunkSize) {
      currentChunk = potentialChunk;
    } else {
      // Jeśli aktualna porcja ma już jakąś zawartość, dodaj ją do wyników
      if (currentChunk) {
        chunks.push(`${currentChunk}.`);
      }
      
      // Jeśli pojedyncze zdanie jest za długie, podziel je na mniejsze części
      if (sentence.length > maxChunkSize) {
        const subChunks = splitSentenceIntoChunks(sentence, maxChunkSize);
        chunks.push(...subChunks);
        currentChunk = '';
      } else {
        currentChunk = sentence;
      }
    }
  }
  
  // Dodaj ostatni fragment, jeśli istnieje
  if (currentChunk) {
    chunks.push(`${currentChunk}.`);
  }
  
  return chunks;
};

/**
 * Dzieli długie zdanie na mniejsze fragmenty
 */
const splitSentenceIntoChunks = (sentence, maxChunkSize) => {
  const chunks = [];
  let remainingSentence = sentence;
  
  while (remainingSentence.length > 0) {
    let chunk;
    
    if (remainingSentence.length <= maxChunkSize) {
      chunk = remainingSentence;
      remainingSentence = '';
    } else {
      // Znajdź ostatnią spację przed limitem, aby nie dzielić słowa
      const lastSpaceIndex = remainingSentence.lastIndexOf(' ', maxChunkSize);
      
      if (lastSpaceIndex === -1) {
        // Jeśli nie ma spacji, dziel po prostu po znakach
        chunk = remainingSentence.substring(0, maxChunkSize);
        remainingSentence = remainingSentence.substring(maxChunkSize);
      } else {
        chunk = remainingSentence.substring(0, lastSpaceIndex);
        remainingSentence = remainingSentence.substring(lastSpaceIndex + 1);
      }
    }
    
    chunks.push(chunk);
  }
  
  return chunks;
};

module.exports = {
  generateAudio
};