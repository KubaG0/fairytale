import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fairytaleService } from '../services/api';

const FairytaleGeneratorPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: '',
    characters: '',
    duration: 60 // domyślna wartość w sekundach
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Wyczyść błąd dla tego pola gdy użytkownik zacznie pisać
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
    
    // Wyczyść błąd API jeśli użytkownik zmodyfikuje dane
    if (apiError) {
      setApiError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Opis musi zawierać co najmniej 10 znaków';
    } else if (/^[A-Z][a-z]+\s(i|oraz)\s[a-z]+/.test(formData.description)) {
      // Sprawdzamy czy opis wygląda jak bohaterowie (np. "Zuzia i jej piesek")
      newErrors.description = 'To pole powinno zawierać temat/rodzaj bajki, a nie bohaterów. Bohaterów wprowadź w polu poniżej.';
    }
    
    if (!formData.characters || formData.characters.trim().length < 3) {
      newErrors.characters = 'Musisz podać co najmniej jednego bohatera';
    } else if (/^(odwaga|przyjaźń|miłość|dobro|pomoc)$/i.test(formData.characters.toLowerCase())) {
      // Sprawdzamy czy bohaterowie wyglądają jak temat bajki
      newErrors.characters = 'To pole powinno zawierać imiona bohaterów, a nie temat bajki. Temat wprowadź w polu powyżej.';
    }
    
    if (!formData.duration || formData.duration < 10 || formData.duration > 180) {
      newErrors.duration = 'Czas trwania musi wynosić od 10 do 180 sekund';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setApiError('');
    
    try {
      // Dodajemy logi dla debugowania
      console.log('Wysyłanie danych:', formData);
      
      // Wywołanie API backendu do generowania bajki
      const response = await fairytaleService.generateFairytale(formData);
      console.log('Odpowiedź z serwera:', response);
      
      // Po pomyślnym wygenerowaniu, przekieruj na stronę bajek
      navigate('/moje-bajki');
    } catch (error) {
      console.error('Błąd podczas generowania bajki:', error);
      setApiError(error.response?.data?.message || 'Wystąpił błąd podczas generowania bajki. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Generator Bajek</h1>
        <p className="text-gray-600">
          Wypełnij formularz, aby wygenerować spersonalizowaną bajkę dla swojego dziecka
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">Jak to działa?</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Opisz rodzaj bajki, który Cię interesuje (np. bajka o przyjaźni, bajka o odwadze)</li>
          <li>Wpisz imiona głównych bohaterów</li>
          <li>Wybierz długość bajki</li>
          <li>Kliknij "Generuj bajkę"</li>
          <li>Bajka zostanie automatycznie wygenerowana i zamieniona na audiobook</li>
          <li>Po zakończeniu generowania znajdziesz bajkę na stronie "Moje bajki"</li>
        </ol>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {apiError && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {apiError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Temat/rodzaj bajki
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Np. "Bajka o przyjaźni", "Przygoda w lesie", "Nauka odwagi"
            </p>
            <textarea
              id="description"
              name="description"
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Podaj temat lub ogólny opis bajki (np. bajka o przyjaźni, o dobru, o pomaganiu...)"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="characters" className="block text-sm font-medium text-gray-700 mb-1">
              Bohaterowie bajki
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Np. "Zuzia i jej piesek", "Rycerz Tomek", "Wróżka Liliana i Czarodziej Maciej"
            </p>
            <input
              id="characters"
              name="characters"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Wprowadź imiona głównych bohaterów (np. Zuzia i jej pies Puszek, rycerz Mikołaj...)"
              value={formData.characters}
              onChange={handleChange}
            />
            {errors.characters && (
              <p className="mt-1 text-sm text-red-600">{errors.characters}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Czas trwania (w sekundach): {formData.duration}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                id="duration"
                name="duration"
                min="10"
                max="180"
                step="10"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                value={formData.duration}
                onChange={handleChange}
              />
              <span className="text-gray-700 w-16 text-right">
                {Math.floor(parseInt(formData.duration) / 60)}:{(parseInt(formData.duration) % 60).toString().padStart(2, '0')}
              </span>
            </div>
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-md transition-colors duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generowanie...
                </span>
              ) : (
                'Generuj bajkę'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FairytaleGeneratorPage;