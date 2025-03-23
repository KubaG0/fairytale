const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const config = require('./config/env');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Import ścieżek API
const authRoutes = require('./routes/authRoutes');
const fairytaleRoutes = require('./routes/fairytaleRoutes');

// Inicjalizacja aplikacji Express
const app = express();

// Połączenie z bazą danych
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logi HTTP w trybie deweloperskim
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Pliki statyczne
app.use(express.static(path.join(__dirname, '../public')));
// Umożliwiamy dostęp do plików audio przez dedykowany endpoint /audio
app.use('/audio', express.static(path.join(__dirname, '../public/audio')));

// Routing API
app.use('/api/auth', authRoutes);
app.use('/api/fairytales', fairytaleRoutes);

// Strona główna
app.get('/', (req, res) => {
  res.send('API działa poprawnie');
});

// Obsługa błędów
app.use(errorHandler);

// Nieobsługiwane ścieżki
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Nie znaleziono zasobu'
  });
});

// Uruchomienie serwera
const PORT = config.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Serwer uruchomiony w trybie ${config.NODE_ENV} na porcie ${PORT}`);
});

// Obsługa zamknięcia serwera
process.on('unhandledRejection', (err) => {
  logger.error(`Błąd: ${err.message}`);
  // Zamknij serwer i zakończ proces
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;
