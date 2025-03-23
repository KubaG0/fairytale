import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HomePage = () => {
  // Używamy hook useAuth zamiast bezpośredniego dostępu do localStorage
  const { isAuthenticated } = useAuth();
  
  // Stan lokalny na wypadek, gdyby useAuth nie zdążył się załadować
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    // Oznaczamy, że sprawdziliśmy stan autoryzacji
    setAuthChecked(true);
  }, [isAuthenticated]);

  // Nie renderujemy niczego, dopóki nie sprawdzimy stanu autoryzacji
  if (!authChecked) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <section className="py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Twórz magiczne bajki dla swoich dzieci
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Wygeneruj spersonalizowane bajki z wyjątkowymi bohaterami i historiami,
              które możesz słuchać w formie audiobooków.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {isAuthenticated ? (
                <Link to="/generator" className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-md text-lg">
                  Utwórz bajkę
                </Link>
              ) : (
                <>
                  <Link to="/register" className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-md text-lg">
                    Zarejestruj się
                  </Link>
                  <Link to="/login" className="border border-primary text-primary hover:bg-primary hover:bg-opacity-10 font-medium py-3 px-6 rounded-md text-lg">
                    Zaloguj się
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="https://via.placeholder.com/600x400?text=bajeczkomat.pl"
              alt="bajeczkomat.pl"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 -mx-4 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Jak to działa?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Opisz bajkę</h3>
              <p className="text-gray-600">
                Podaj krótki opis, bohaterów i wybierz długość bajki, którą chcesz wygenerować.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Generuj audiobook</h3>
              <p className="text-gray-600">
                Nasza sztuczna inteligencja stworzy unikalną bajkę i przekształci ją w audiobook.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Pobierz i słuchaj</h3>
              <p className="text-gray-600">
                Pobierz wygenerowaną bajkę w formacie MP3 i słuchaj jej z dzieckiem o dowolnej porze.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="bg-primary text-white rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Gotowy na tworzenie magicznych opowieści?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Zarejestruj się już dziś i zacznij tworzyć niepowtarzalne bajki dla swoich dzieci.
          </p>
          {!isAuthenticated ? (
            <Link to="/register" className="bg-accent hover:bg-accent-dark text-white font-medium py-3 px-8 rounded-md text-lg">
              Rozpocznij przygodę
            </Link>
          ) : (
            <Link to="/generator" className="bg-accent hover:bg-accent-dark text-white font-medium py-3 px-8 rounded-md text-lg">
              Generuj bajkę
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;