import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from '../database.js';
import authRoutes from '../routes/auth.js';
import seriesRoutes from '../routes/series.js';
import episodesRoutes from '../routes/episodes.js';
import usersRoutes from '../routes/users.js';
import adminStatsRouter from '../routes/adminStats.js';
import achievementsRoutes from '../routes/achievements.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statyczne pliki
app.use('/audio', express.static(path.join(__dirname, '../../../public/audio')));
app.use('/arkusze', express.static(path.join(__dirname, '../../../public/arkusze')));
app.use('/series-images', express.static(path.join(__dirname, '../../../public/series-images')));

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
app.use('/api/admin-stats', apiLimiter, adminStatsRouter);
app.use('/api/achievements', apiLimiter, achievementsRoutes);

// Podstawowa trasa
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Food 4 Thought API działa!' });
});

// Obsługa błędów 404
app.use((req, res) => {
  res.status(404).json({ error: 'Nie znaleziono strony' });
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

export default app; 