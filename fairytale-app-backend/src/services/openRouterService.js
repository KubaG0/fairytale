// openRouterService.js
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Serwis do generowania tekstu bajek przez OpenRouter API
 */
class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = 'rekafury/reka-flash-3'; // Model Reka Flash 3
  }

  /**
   * Generuje tekst bajki na podstawie dostarczonych parametrów
   * @param {Object} params - Parametry bajki
   * @param {string} params.description - Temat/rodzaj bajki
   * @param {string} params.characters - Bohaterowie bajki
   * @param {number} params.duration - Czas trwania bajki w sekundach
   * @param {number} params.max_retries - Maksymalna liczba prób (opcjonalnie)
   * @param {boolean} params.force_polish - Czy wymusić język polski (opcjonalnie)
   * @returns {Promise<string>} - Tekst wygenerowanej bajki
   */
  async generateText(params) {
    const { description, characters, duration, max_retries = 3, force_polish = true } = params;
    
    // Szacowana liczba słów na podstawie czasu trwania (średnio 2 słowa/sekundę)
    const estimatedWordCount = duration * 2;
    
    // Szacowana liczba znaków (średnio 6 znaków na słowo + spacje)
    const estimatedCharCount = estimatedWordCount * 7;
    
    logger.info(`Wysyłanie zapytania do API OpenRouter`);
    
    // Ustaw podstawowe parametry zapytania
    let attempts = 0;
    let generatedText = '';
    let isEnglish = true; // Zakładamy, że odpowiedź może być po angielsku
    
    // Pętla prób, kontynuuj dopóki nie osiągniesz max_retries lub uzyskasz poprawny tekst
    while (attempts < max_retries && (generatedText.length < 50 || isEnglish)) {
      attempts++;
      
      try {
        // Dostosowanie promptu w zależności od liczby prób
        let prompt = this._buildPrompt(description, characters, estimatedWordCount, attempts, force_polish);
        
        const response = await axios.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: this.model,
            messages: [
              {
                role: 'system',
                content: `Jesteś profesjonalnym pisarzem bajek dla dzieci, piszącym tylko po polsku. Twoje bajki są odpowiednie dla dzieci w wieku 3-10 lat.`
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7 + (attempts * 0.1), // Zwiększamy losowość z każdą próbą
            max_tokens: Math.min(estimatedCharCount / 3, 2000), // Limit tokenów (szacunkowo)
            top_p: 0.9,
            presence_penalty: 0.1,
            frequency_penalty: 0.4
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        generatedText = response.data.choices[0].message.content.trim();
        
        logger.info(`Otrzymano odpowiedź z API OpenRouter`);
        
        // Sprawdź czy tekst jest w języku polskim
        isEnglish = this._isEnglishText(generatedText);
        
        if (isEnglish) {
          logger.error(`Wygenerowany tekst jest w języku angielskim, próba ${attempts}/${max_retries}`);
          continue; // Spróbuj ponownie
        }
        
        // Sprawdź czy tekst jest wystarczająco długi
        if (generatedText.length < 50) {
          logger.error(`Wygenerowany tekst bajki jest zbyt krótki: "${generatedText}"`);
          continue; // Spróbuj ponownie
        }
        
        return generatedText;
        
      } catch (error) {
        logger.error(`Błąd podczas generowania tekstu (próba ${attempts}/${max_retries}): ${error.message}`);
        if (error.response) {
          logger.error(`Status: ${error.response.status}, Dane: ${JSON.stringify(error.response.data)}`);
        }
        
        // Krótkie opóźnienie przed kolejną próbą
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Jeśli wszystkie próby zawiodły, wygeneruj awaryjną bajkę
    logger.info(`Wszystkie próby generowania zawiodły, zwracam awaryjny tekst`);
    return this._generateFallbackText(description, characters, duration);
  }
  
  /**
   * Buduje prompt dla API w zależności od liczby prób
   * @private
   */
  _buildPrompt(description, characters, wordCount, attempt, forcePolish) {
    let prompt = '';
    
    if (attempt === 1) {
      prompt = `Napisz bajkę dla dzieci o temacie "${description}" z bohaterami "${characters}". 
        Bajka powinna mieć około ${wordCount} słów i być odpowiednia dla dzieci w wieku 3-10 lat.
        Pisz TYLKO w języku polskim.`;
    } else if (attempt === 2) {
      prompt = `WAŻNE: Odpowiadaj TYLKO PO POLSKU. Nie pisz nic po angielsku.
        Napisz WYŁĄCZNIE polską bajkę dla dzieci o "${description}" z postaciami "${characters}".
        Bajka powinna mieć około ${wordCount} słów. Unikaj dialogów, skupiaj się na narracji.`;
    } else {
      prompt = `OBOWIĄZKOWO ODPOWIADAJ TYLKO PO POLSKU.
        Napisz prostą bajkę dla małych dzieci po polsku. Temat: ${description}. Bohaterowie: ${characters}.
        Długość: około ${wordCount} słów. Pisz prostym językiem. NIE używaj angielskich słów.
        NIE wyjaśniaj nic. Zwróć TYLKO tekst bajki.`;
    }
    
    if (forcePolish) {
      prompt += `\n\nTWOJA ODPOWIEDŹ MUSI BYĆ W JĘZYKU POLSKIM. TO BARDZO WAŻNE.`;
    }
    
    return prompt;
  }
  
  /**
   * Sprawdza czy tekst jest w języku angielskim
   * @private
   */
  _isEnglishText(text) {
    if (!text) return true;
    
    // Szukanie angielskich słów i zwrotów
    const englishPatterns = [
      /\b(the|and|of|to|is|in|that|it|for|you|with|on|this|have|are|as)\b/gi,
      /\bonce upon a time\b/i,
      /\bthe end\b/i,
      /\bfairy tale\b/i
    ];
    
    // Stosunek angielskich słów do długości tekstu
    const englishWords = englishPatterns.reduce((count, pattern) => {
      const matches = text.match(pattern) || [];
      return count + matches.length;
    }, 0);
    
    // Sprawdź czy brakuje polskich znaków
    const hasPolishLetters = /[ąćęłńóśźż]/i.test(text);
    
    // Sprawdź pierwsze 100 znaków
    const firstPart = text.substring(0, 100).toLowerCase();
    
    // Jeśli pierwsze zdanie zawiera angielskie typowe zwroty, uznaj za angielski
    if (firstPart.includes('once upon a time') || 
        firstPart.includes('here is a fairy tale') ||
        firstPart.includes('i will write a story')) {
      return true;
    }
    
    // Heurystyczna ocena - jeśli dużo angielskich słów i mało polskich znaków
    return (englishWords > 5 && !hasPolishLetters);
  }
  
  /**
   * Generuje awaryjny tekst bajki, gdy API zawiedzie
   * @private
   */
  _generateFallbackText(description, characters, duration) {
    const wordCount = duration * 2;
    const shortDesc = description.toLowerCase().replace('bajka o ', '').replace('bajka ', '');
    
    return `Dawno, dawno temu, w niezwykłej krainie żył sobie ${characters}. 
    Wszyscy w okolicy wiedzieli, że jest to postać wyjątkowa, ponieważ cechowała ją niezwykła ${shortDesc}.
    
    Każdego dnia ${characters} wyruszał na nowe przygody, poznając mieszkańców zaczarowanego lasu.
    Zwierzęta bardzo lubiły ${characters}, ponieważ zawsze im pomagał i traktował z życzliwością.
    
    Pewnego ranka ${characters} obudził się i zobaczył, że niebo zasnuły ciemne chmury.
    "Coś dziwnego dzieje się w naszym lesie" - pomyślał, wyglądając przez okno swojego domku.
    
    Założył swój ulubiony płaszcz i wyruszył sprawdzić, co się stało. Po drodze spotkał małego zajączka,
    który drżał ze strachu.
    
    "Co się stało, mały przyjacielu?" - zapytał ${characters}.
    
    "W lesie pojawił się smok, który zabrał całą naszą magiczną rosę! Bez niej wszystkie rośliny zwiędną,
    a my nie będziemy mieli co jeść" - odpowiedział zajączek.
    
    ${characters} bez wahania postanowił pomóc mieszkańcom lasu. Odważnie wyruszył w stronę najwyższej góry,
    gdzie podobno zamieszkał smok.
    
    Droga była długa i trudna, ale ${characters} nie poddawał się. Po wielu godzinach wspinaczki dotarł
    do jaskini smoka.
    
    Ku jego zdziwieniu, smok wcale nie był groźny. Okazało się, że był bardzo samotny i zabrał magiczną rosę,
    bo myślał, że dzięki niej znajdzie przyjaciół.
    
    ${characters} opowiedział smokowi o zmartwieniach mieszkańców lasu. Smok zrozumiał, że postąpił niewłaściwie
    i zgodził się zwrócić magiczną rosę.
    
    W zamian ${characters} obiecał często odwiedzać smoka i zostać jego przyjacielem.
    
    Gdy wrócili do lasu, wszyscy mieszkańcy świętowali. Magiczna rosa znów pokryła wszystkie rośliny,
    a las odzyskał swój blask.
    
    Od tej pory ${characters} i smok spędzali razem wiele czasu, a mieszkańcy lasu żyli szczęśliwie.
    
    Ta historia nauczyła wszystkich, że ${shortDesc} i przyjaźń potrafią pokonać każde przeciwności.`;
  }
}

module.exports = new OpenRouterService();