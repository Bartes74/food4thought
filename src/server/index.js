import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDb } from './database.js';
import authRoutes from './routes/auth.js';
import seriesRoutes from './routes/series.js';
import episodesRoutes from './routes/episodes.js';
import usersRoutes from './routes/users.js';
import adminStatsRouter from './routes/adminStats.js';
import achievementsRoutes from './routes/achievements.js';
import notificationsRouter from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statyczne pliki
app.use('/audio', express.static(path.join(__dirname, '../../public/audio')));
app.use('/arkusze', express.static(path.join(__dirname, '../../public/arkusze')));
app.use('/series-images', express.static(path.join(__dirname, '../../public/series-images')));

// Serwuj aplikację React
app.use(express.static(path.join(__dirname, '../../dist')));

// Trasy API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  message:
    'Zbyt wiele żądań pochodzących z tego IP, proszę spróbuj ponownie po 15 minutach',
});

app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/series', apiLimiter, seriesRoutes);
app.use('/api/episodes', apiLimiter, episodesRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/admin', apiLimiter, adminStatsRouter);
app.use('/api/achievements', apiLimiter, achievementsRoutes);
app.use('/api/notifications', apiLimiter, notificationsRouter);

// Podstawowa trasa
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Food 4 Thought API działa!' });
});

// Obsługa błędów 404 - dla API zwróć JSON, dla innych ścieżek serwuj React app
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Nie znaleziono endpointu API' });
});

// Dla wszystkich innych ścieżek serwuj aplikację React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Globalny handler błędów
app.use((err, req, res, next) => {
  console.error('=== ERROR ===');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error:', err.stack);
  console.error('=============');
  res.status(500).json({ error: 'Coś poszło nie tak!', details: err.message });
});

// Start serwera
app.listen(PORT, () => {
  console.log(`🚀 Serwer Food 4 Thought działa na porcie ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

// Eksport aplikacji dla testów
export default app;
