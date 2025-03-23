// src/pages/MyFairytalesPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fairytaleService } from '../services/api';
import FairytalePlayer from '../components/fairytale/FairytalePlayer';

const MyFairytalesPage = () => {
  const [fairytales, setFairytales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshIntervalRef = useRef(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Funkcja pobierająca bajki z API
  const fetchFairytales = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoading(prevLoading => prevLoading && fairytales.length === 0);
      }
      
      console.log('Pobieranie bajek z API...');
      const response = await fairytaleService.getFairytales();
      
      // Bezpieczne pobieranie danych
      const fairytalesData = response.data?.data || [];
      console.log('Pobrane bajki:', fairytalesData);
      
      // Wyświetlanie statusów bajek dla debugowania
      fairytalesData.forEach(fairytale => {
        console.log(`Bajka ${fairytale._id}: status=${fairytale.status}, audioUrl=${fairytale.audioUrl ? 'exists' : 'missing'}`);
      });
      
      setFairytales(fairytalesData);
      setLastRefreshTime(new Date());
      setError(null);
      
      return fairytalesData;
    } catch (err) {
      console.error('Błąd podczas pobierania bajek:', err);
      setError(err.response?.data?.message || 'Nie udało się pobrać Twoich bajek. Spróbuj ponownie później.');
      setIsLoading(false);
      return [];
    }
  }, [fairytales.length]);

  // Funkcja sprawdzająca czy potrzebne jest automatyczne odświeżanie
  const checkNeedsRefresh = useCallback((fairytalesData) => {
    // Sprawdź, czy któraś bajka ma status wymagający odświeżania
    return fairytalesData.some(
      fairytale => ['generating', 'regenerating_audio'].includes(fairytale.status)
    );
  }, []);

  // Ustaw interwał odświeżania przy pierwszym renderowaniu
  useEffect(() => {
    const setupRefreshInterval = async () => {
      // Pobierz bajki po raz pierwszy
      const initialFairytales = await fetchFairytales(true);
      setIsLoading(false);
      
      // Ustaw interwał odświeżania jeśli są bajki w trakcie generowania
      if (checkNeedsRefresh(initialFairytales) && autoRefreshEnabled) {
        console.log('Ustawiam automatyczne odświeżanie');
        if (!refreshIntervalRef.current) {
          refreshIntervalRef.current = setInterval(async () => {
            console.log('Automatyczne odświeżanie - czas minął');
            const freshFairytales = await fetchFairytales(false);
            
            // Jeśli nie ma już bajek do odświeżania, wyłącz interwał
            if (!checkNeedsRefresh(freshFairytales)) {
              console.log('Brak bajek do odświeżania - zatrzymuję interwał');
              clearInterval(refreshIntervalRef.current);
              refreshIntervalRef.current = null;
            }
          }, 3000);
        }
      }
    };

    setupRefreshInterval();
    
    // Czyszczenie interwału przy odmontowaniu komponentu
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [fetchFairytales, checkNeedsRefresh, autoRefreshEnabled]);

  // Przycisk do manualnego odświeżenia listy
  const handleRefresh = async () => {
    console.log('Ręczne odświeżanie listy bajek');
    await fetchFairytales(true);
  };

  // Funkcja usuwająca bajkę
  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę bajkę?')) {
      try {
        await fairytaleService.deleteFairytale(id);
        // Odśwież listę bajek po usunięciu
        await fetchFairytales(false);
      } catch (err) {
        console.error('Błąd podczas usuwania bajki:', err);
        alert('Nie udało się usunąć bajki. Spróbuj ponownie.');
      }
    }
  };

  // Funkcja odświeżająca pojedynczą bajkę
  const handleRegenerateAudio = async (id) => {
    try {
      await fairytaleService.regenerateAudio(id);
      await fetchFairytales(false);
      
      // Uruchom automatyczne odświeżanie
      if (!refreshIntervalRef.current && autoRefreshEnabled) {
        refreshIntervalRef.current = setInterval(async () => {
          const freshFairytales = await fetchFairytales(false);
          
          if (!checkNeedsRefresh(freshFairytales)) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Błąd podczas regeneracji audio:', err);
      alert('Nie udało się rozpocząć regeneracji audio. Spróbuj ponownie.');
    }
  };

  // Formatowanie daty
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatowanie czasu od ostatniego odświeżenia
  const getLastRefreshText = () => {
    if (!lastRefreshTime) return 'Nie odświeżono jeszcze';
    
    const now = new Date();
    const diffSeconds = Math.floor((now - lastRefreshTime) / 1000);
    
    if (diffSeconds < 5) return 'Przed chwilą';
    if (diffSeconds < 60) return `${diffSeconds} sekund temu`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    return `${diffMinutes} minut temu`;
  };

  // Automatyczne usuwanie niepotrzebnych bajek
  useEffect(() => {
    // Funkcja czyszcząca nieudane bajki po określonym czasie
    const cleanupFailedFairytales = () => {
      const failedFairytales = fairytales.filter(f => 
        f.status === 'failed' && !f.textContent
      );
      
      failedFairytales.forEach(fairytale => {
        const timeSinceCreation = new Date() - new Date(fairytale.createdAt);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeSinceCreation > fiveMinutes) {
          console.log(`Automatyczne usuwanie nieudanej bajki ${fairytale._id}`);
          handleDelete(fairytale._id);
        }
      });
    };
    
    // Wywołaj czyszczenie tylko jeśli mamy bajki
    if (fairytales.length > 0) {
      cleanupFailedFairytales();
    }
  }, [fairytales]);

  // Renderowanie podczas ładowania
  if (isLoading && fairytales.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Ładowanie Twoich bajek...</p>
        </div>
      </div>
    );
  }

  // Renderowanie w przypadku błędu
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
        <div className="text-center">
          <button 
            onClick={handleRefresh} 
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Moje Bajki</h1>
        <div className="flex space-x-3">
          <div className="flex items-center text-sm text-gray-500">
            <span>Ostatnie odświeżenie: {getLastRefreshText()}</span>
            <label className="ml-4 inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="ml-2">Auto-odświeżanie</span>
            </label>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 p-2 rounded-md transition-colors"
            title="Odśwież listę"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
          <Link 
            to="/generator" 
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors"
          >
            Stwórz nową bajkę
          </Link>
        </div>
      </div>

      {fairytales.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Nie masz jeszcze żadnych bajek</h2>
          <p className="text-gray-600 mb-6">
            Utwórz swoją pierwszą bajkę, klikając przycisk poniżej!
          </p>
          <Link 
            to="/generator" 
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors"
          >
            Stwórz bajkę
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {fairytales.map((fairytale) => (
            <div
              key={fairytale._id}
              className="bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{fairytale.characters}</h2>
                  <p className="text-gray-500 text-sm">
                    Utworzono: {formatDate(fairytale.createdAt)}
                  </p>
                </div>
                <div className="flex">
                  {fairytale.status === 'completed_no_audio' && fairytale.textContent && (
                    <button
                      onClick={() => handleRegenerateAudio(fairytale._id)}
                      className="text-blue-500 hover:text-blue-700 p-2 cursor-pointer"
                      title="Spróbuj ponownie wygenerować audio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(fairytale._id)}
                    className="text-red-500 hover:text-red-700 p-2 cursor-pointer"
                    title="Usuń bajkę"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="mb-4 text-gray-700">{fairytale.description}</p>

              {/* Renderowanie statusu z ulepszoną logiką */}
              {fairytale.status === 'generating' ? (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-md flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Trwa generowanie bajki...</span>
                </div>
              ) : fairytale.status === 'regenerating_audio' ? (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-md flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Trwa ponowne generowanie audio...</span>
                </div>
              ) : fairytale.status === 'failed' ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-md">
                  <p className="mb-2">Nie udało się wygenerować bajki.</p>
                  {fairytale.textContent ? (
                    <button 
                      onClick={() => handleRegenerateAudio(fairytale._id)}
                      className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                    >
                      Spróbuj ponownie wygenerować audio
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleDelete(fairytale._id)}
                      className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                    >
                      Usuń i spróbuj ponownie
                    </button>
                  )}
                </div>
              ) : fairytale.status === 'completed' ? (
                <div className="bg-gray-100 p-4 rounded-md">
                  {fairytale.textContent && (
                    <>
                      <h3 className="font-medium mb-2">Tekst bajki:</h3>
                      <div className="max-h-40 overflow-y-auto mb-4 whitespace-pre-line text-gray-700">
                        {fairytale.textContent}
                        <button 
                          onClick={() => {
                            const textArea = document.createElement('textarea');
                            textArea.value = fairytale.textContent;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            alert('Tekst bajki skopiowany do schowka!');
                          }}
                          className="text-xs text-primary hover:text-primary-dark ml-2"
                        >
                          Kopiuj tekst
                        </button>
                      </div>
                    </>
                  )}
                  {fairytale.audioUrl ? (
                    <div>
                      <h3 className="font-medium mb-2">Audiobook:</h3>
                      <FairytalePlayer audioUrl={fairytale.audioUrl} title={fairytale.characters} />
                    </div>
                  ) : (
                    <div className="text-yellow-600 mt-2">
                      Tekst bajki został wygenerowany, ale nie udało się utworzyć pliku audio.
                      <button 
                        onClick={() => handleRegenerateAudio(fairytale._id)}
                        className="ml-2 text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
                      >
                        Generuj audio
                      </button>
                    </div>
                  )}
                </div>
              ) : fairytale.status === 'completed_no_audio' ? (
                <div className="bg-yellow-50 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-yellow-700">
                      Tekst bajki został wygenerowany, ale nie udało się utworzyć pliku audio.
                    </div>
                    <button 
                      onClick={() => handleRegenerateAudio(fairytale._id)}
                      className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors ml-4"
                    >
                      Spróbuj ponownie
                    </button>
                  </div>
                  {fairytale.textContent && (
                    <div className="max-h-40 overflow-y-auto whitespace-pre-line text-gray-700 mt-2">
                      {fairytale.textContent}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
                  Bajka oczekuje na przetworzenie. Status: {fairytale.status || 'nieznany'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFairytalesPage;