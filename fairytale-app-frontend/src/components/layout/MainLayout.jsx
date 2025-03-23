import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Poprawiona ścieżka

const MainLayout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">Bajkowy Generator</Link>
          <nav className="flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-200">Strona główna</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/generator" className="hover:text-blue-200">Generator</Link>
                <Link to="/moje-bajki" className="hover:text-blue-200">Moje bajki</Link>
                <button 
                  onClick={handleLogout}
                  className="bg-accent hover:bg-accent-dark px-4 py-2 rounded"
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">Logowanie</Link>
                <Link to="/register" className="bg-accent hover:bg-accent-dark px-4 py-2 rounded">
                  Rejestracja
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-primary-dark text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Bajkowy Generator. Wszelkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;