const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Serwis do generowania tekstu bajki przy użyciu Hugging Face API
 */
const generateText = async (data) => {
  try {
    const { description, characters, duration } = data;
    
    // Przygotuj prompt dla modelu w języku polskim
    const prompt = `Napisz krótką bajkę dla dzieci w języku polskim. 
    Temat: ${description}
    Główni bohaterowie: ${characters}
    Długość bajki powinna być odpowiednia do czytania na głos przez około ${Math.round(duration / 60)} minut.
    
    Bajka powinna mieć następujące cechy:
    - Prosty, zrozumiały język odpowiedni dla dzieci
    - Pozytywne przesłanie lub morał na końcu
    - Wyraźny początek, rozwinięcie i zakończenie
    - Kreatywny i angażujący opis bohaterów i miejsc
    
    Bajka:`;
    
    logger.info(`Generowanie tekstu bajki z opisem: ${description}, bohaterami: ${characters}`);
    
    // Drukujemy cały nagłówek autoryzacji (bez pokazywania pełnego klucza dla bezpieczeństwa)
    const authHeader = `Bearer ${config.HUGGING_FACE_API_KEY}`;
    console.log('Nagłówek autoryzacji:', authHeader.substring(0, 15) + '...');
    
    // Używamy bezpośrednio klucza dla testów (w produkcji zawsze używaj zmiennych środowiskowych)
    const apiKey = "";
    
    // Model dla języka polskiego - próbujemy użyć modelu plbart do generowania tekstu w języku polskim
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/Lajonbot/polish-gpt2-small-instruct', // zmieniony model
      { 
        inputs: prompt,
        parameters: {
          max_length: calculateMaxLength(duration),
          temperature: 0.8,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`, // używamy bezpośrednio klucza
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Odpowiedź z Hugging Face API:', response.data);
    
    // Wyciągnij wygenerowany tekst
    let generatedText = '';
    if (response.data && response.data[0] && response.data[0].generated_text) {
      generatedText = response.data[0].generated_text;
    } else {
      // Jeśli odpowiedź ma inny format, próbujemy wyciągnąć tekst
      generatedText = response.data && typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);
    }
    
    // Formatowanie tekstu (usunięcie zbędnych białych znaków, poprawa formatowania)
    generatedText = formatText(generatedText);
    
    logger.info(`Wygenerowano tekst bajki o długości ${generatedText.length} znaków`);
    
    return generatedText;
  } catch (error) {
    console.error('Błąd podczas komunikacji z Hugging Face API:', error.response?.data || error.message);
    logger.error(`Błąd generowania tekstu: ${error.message}`);
    
    // Pełna informacja o błędzie dla celów diagnostycznych
    console.error('Pełny błąd:', error);
    
    // Jeśli nie udało się połączyć z API, zwracamy demonstracyjny tekst zamiast rzucać wyjątek
    if (error.response && error.response.status === 401) {
      console.log('Używamy przykładowej bajki z powodu błędu autoryzacji');
      return generateDummyFairytale(data.description, data.characters);
    }
    
    if (error.response) {
      logger.error(`Status błędu: ${error.response.status}`);
      logger.error(`Dane błędu: ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error('Nie udało się wygenerować tekstu bajki. Spróbuj ponownie później.');
  }
};

/**
 * Generuje przykładową bajkę gdy API Hugging Face jest niedostępne
 */
const generateDummyFairytale = (description, characters) => {
  // Podziel postacie na listę
  const charactersList = characters.split(/,| i | oraz /).filter(c => c.trim() !== '');
  const mainCharacter = charactersList[0] || 'Bohater';
  const otherCharacters = charactersList.slice(1);
  
  // Utworzenie prostej bajki
  return `Dawno, dawno temu, w magicznej krainie żył sobie ${mainCharacter}. 
  ${description ? 'To była opowieść o ' + description + '.' : ''}
  
  Każdego dnia ${mainCharacter} wyruszał na wspaniałe przygody${otherCharacters.length > 0 ? ' razem z przyjaciółmi: ' + otherCharacters.join(', ') : ''}.
  
  Pewnego razu podczas spaceru po lesie ${mainCharacter} znalazł magiczny kamień. Kamień lśnił wszystkimi kolorami tęczy i wydawał się szeptać tajemnicze słowa.
  
  "${mainCharacter}, twoje serce jest pełne dobroci. Używaj tego kamienia mądrze, aby pomagać innym" - usłyszał.
  
  Od tego dnia ${mainCharacter} używał magicznego kamienia, aby pomagać wszystkim mieszkańcom krainy. ${otherCharacters.length > 0 ? 'Razem z ' + otherCharacters.join(' i ') + ' ' : ''}rozwiązywał problemy, dzielił się z potrzebującymi i szerząc radość.
  
  Mieszkańcy krainy byli bardzo wdzięczni i nauczyli się od ${mainCharacter}a, że największa magia to dobroć i życzliwość, która mieszka w sercu każdego z nas.
  
  I żyli długo i szczęśliwie.`;
};

/**
 * Oblicza maksymalną długość tekstu na podstawie czasu trwania
 */
const calculateMaxLength = (duration) => {
  // Średnio czytamy około 150-180 słów na minutę
  // Przyjmijmy 6 znaków + spacja na słowo (średnio)
  const wordsPerMinute = 150;
  const avgCharsPerWord = 7; // dla języka polskiego
  
  const minutes = duration / 60;
  const maxWords = wordsPerMinute * minutes;
  const maxChars = maxWords * avgCharsPerWord;
  
  // Dodaj margines bezpieczeństwa
  const maxLength = Math.max(200, Math.min(2000, Math.round(maxChars)));
  
  logger.debug(`Obliczono maksymalną długość tekstu: ${maxLength} dla czasu ${duration}s`);
  
  return maxLength;
};

/**
 * Formatuje wygenerowany tekst
 */
const formatText = (text) => {
  if (!text) return '';
  
  // Usuń nadmiarowe białe znaki
  text = text.replace(/\s+/g, ' ').trim();
  
  // Upewnij się, że tekst zaczyna się z dużej litery
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  // Popraw podwójne kropki, znaki zapytania, itp.
  text = text.replace(/\.{2,}/g, '.');
  text = text.replace(/\?{2,}/g, '?');
  text = text.replace(/\!{2,}/g, '!');
  
  // Upewnij się, że tekst kończy się kropką, znakiem zapytania lub wykrzyknikiem
  if (!/[.!?]$/.test(text)) {
    text += '.';
  }
  
  // Popraw spacje przed znakami interpunkcyjnymi
  text = text.replace(/ +([,.!?;:])/g, '$1');
  
  // Dodaj podział na akapity (co ~3-4 zdania)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 3) {
    let formattedText = '';
    for (let i = 0; i < sentences.length; i++) {
      formattedText += sentences[i].trim() + ' ';
      if ((i + 1) % 3 === 0 && i < sentences.length - 1) {
        formattedText += '\n\n';
      }
    }
    return formattedText.trim();
  }
  
  return text;
};

module.exports = {
  generateText
};