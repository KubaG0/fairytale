import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FairytaleGeneratorPage from './pages/FairytaleGeneratorPage';
import MyFairytalesPage from './pages/MyFairytalesPage';
import { useAuth } from './hooks/useAuth';

// Komponent chroniący trasy wymagające logowania
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Ładowanie...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Komponent zawierający trasy
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route 
          path="generator" 
          element={
            <ProtectedRoute>
              <FairytaleGeneratorPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="moje-bajki" 
          element={
            <ProtectedRoute>
              <MyFairytalesPage />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;