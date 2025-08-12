// Simplified version of test-app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simplified app factory
function createTestApp() {
  const app = express();
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Basic middleware
  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(limiter);
  
  // Simple health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Food 4 Thought API działa!' });
  });
  
  // Test database endpoint
  app.get('/api/test-db', (req, res) => {
    res.json({ result: 1 });
  });
  
  // Auth endpoints for testing
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Sprawdź brakujące dane PRZED sprawdzeniem poświadczeń
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    
    if (email === 'admin@food4thought.local' && password === 'admin') {
      res.json({
        token: 'admin-token',
        user: { id: 1, email, role: 'super_admin' }
      });
    } else if (email === 'test@example.com' && password === 'test123') {
      res.json({
        token: 'user-token',
        user: { id: 2, email, role: 'user' }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
  
  app.post('/api/auth/register', (req, res) => {
    const { email, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    // Sprawdź format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Sprawdź siłę hasła
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password too weak' });
    }
    
    // Sprawdź istniejący email
    if (email === 'admin@food4thought.local' || email === 'test@example.com') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(201).json({
      message: 'User created successfully',
      user: { id: 3, email, role: 'user' }
    });
  });
  
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token === 'admin-token') {
      res.json({ id: 1, email: 'admin@food4thought.local', role: 'super_admin' });
    } else if (token === 'user-token') {
      res.json({ id: 2, email: 'test@example.com', role: 'user' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  });
  
  // Series endpoints for testing
  app.get('/api/series', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json([
      { id: 1, name: 'Test Series 1', color: '#ff0000', image: 'test1.jpg' },
      { id: 2, name: 'Test Series 2', color: '#00ff00', image: 'test2.jpg' }
    ]);
  });
  
  app.get('/api/series/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json({ id: req.params.id, name: 'Test Series', color: '#ff0000', image: 'test.jpg' });
  });
  
  app.delete('/api/series/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({ message: 'Series deleted successfully' });
  });
  
  // Episodes endpoints for testing
  app.get('/api/episodes/my', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json({
      new: [
        { 
          id: 1, 
          title: 'New Episode 1', 
          series_id: 1,
          series_name: 'Test Series 1',
          series_color: '#ff0000',
          series_image: 'test1.jpg'
        }
      ],
      inProgress: [
        { 
          id: 2, 
          title: 'In Progress Episode', 
          series_id: 1,
          series_name: 'Test Series 1',
          series_color: '#ff0000',
          series_image: 'test1.jpg',
          user_position: 300,
          user_completed: 0,
          user_last_played: '2024-01-01T00:00:00Z'
        }
      ],
      completed: [
        { 
          id: 3, 
          title: 'Completed Episode', 
          series_id: 2,
          series_name: 'Test Series 2',
          series_color: '#00ff00',
          series_image: 'test2.jpg',
          user_position: 1800,
          user_completed: 1,
          user_last_played: '2024-01-01T00:00:00Z'
        }
      ]
    });
  });
  
  app.get('/api/episodes/favorites', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json([
      { 
        id: 1, 
        title: 'Favorite Episode 1', 
        series_id: 1,
        series_name: 'Test Series 1',
        series_color: '#ff0000',
        series_image: 'test1.jpg',
        favorited_at: '2024-01-01T00:00:00Z'
      }
    ]);
  });
  
  app.get('/api/episodes/my/top-rated', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json([
      { 
        id: 1, 
        title: 'Top Rated Episode', 
        series_id: 1,
        series_name: 'Test Series 1',
        series_color: '#ff0000',
        series_image: 'test1.jpg',
        rating: 5,
        rated_at: '2024-01-01T00:00:00Z'
      }
    ]);
  });
  
  app.get('/api/episodes/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    if (req.params.id === '99999') {
      return res.status(404).json({ error: 'Episode not found' });
    }
    
    res.json({ 
      id: req.params.id, 
      title: 'Test Episode', 
      series_id: 1 
    });
  });
  
  app.post('/api/episodes/:id/progress', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json({ message: 'Progress saved successfully' });
  });
  
  app.post('/api/episodes/:id/favorite', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json({ message: 'Added to favorites' });
  });
  
  app.delete('/api/episodes/:id/favorite', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json({ message: 'Removed from favorites' });
  });
  
  app.post('/api/episodes/:id/rating', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { rating } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }
    
    res.json({ message: 'Rating saved successfully' });
  });
  
  app.get('/api/episodes/:id/rating', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json({ rating: req.params.id === '1' ? 5 : null });
  });
  
  app.get('/api/episodes/:id/average-rating', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json({ average_rating: 4.5, rating_count: 10 });
  });
  
  app.delete('/api/episodes/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({ message: 'Episode deleted successfully' });
  });
  
  // User statistics endpoints
  app.get('/api/users/:id/stats', (req, res) => {
    const authHeader = req.headers.authorization;
    const userId = req.params.id;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Sprawdź czy użytkownik ma dostęp do swoich danych
    if (token === 'user-token' && userId !== '2') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      total_episodes: 10,
      completed_episodes: 5,
      favorite_episodes: 3
    });
  });
  
  app.get('/api/users/series-stats', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json([
      { series_id: 1, series_name: 'Test Series 1', episodes_count: 5, completed_count: 3 }
    ]);
  });
  
  app.get('/api/users/:id/favorites', (req, res) => {
    const authHeader = req.headers.authorization;
    const userId = req.params.id;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Sprawdź czy użytkownik ma dostęp do swoich danych
    if (token === 'user-token' && userId !== '2') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json([
      { id: 1, title: 'Favorite Episode 1', series_id: 1 }
    ]);
  });
  
  app.get('/api/users/:id/history', (req, res) => {
    const authHeader = req.headers.authorization;
    const userId = req.params.id;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Sprawdź czy użytkownik ma dostęp do swoich danych
    if (token === 'user-token' && userId !== '2') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json([
      { episode_id: 1, title: 'Episode 1', listened_at: '2024-01-01T00:00:00Z' }
    ]);
  });
  
  app.get('/api/users/:id/patterns', (req, res) => {
    const authHeader = req.headers.authorization;
    const userId = req.params.id;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Sprawdź czy użytkownik ma dostęp do swoich danych
    if (token === 'user-token' && userId !== '2') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      preferred_time: 'evening',
      preferred_duration: 30,
      preferred_series: [1, 2]
    });
  });
  
  // Achievements endpoints
  app.get('/api/achievements', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json([
      { id: 1, name: 'First Episode', description: 'Listen to your first episode', progress: 100 }
    ]);
  });
  
  app.post('/api/achievements/check', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    res.json({ message: 'Achievements checked successfully' });
  });
  
  // Admin endpoints
  app.get('/api/admin/stats', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({
      total_users: 10,
      total_episodes: 50,
      total_series: 5
    });
  });
  
  app.get('/api/admin/users', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json([
      { id: 1, email: 'admin@food4thought.local', role: 'super_admin' },
      { id: 2, email: 'test@example.com', role: 'user' }
    ]);
  });
  
  app.put('/api/admin/users/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({ message: 'User updated successfully' });
  });
  
  app.delete('/api/admin/users/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({ message: 'User deleted successfully' });
  });
  
  app.get('/api/admin/series', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json([
      { id: 1, name: 'Admin Series 1', color: '#ff0000', image: 'admin1.jpg' },
      { id: 2, name: 'Admin Series 2', color: '#00ff00', image: 'admin2.jpg' }
    ]);
  });
  
  app.post('/api/admin/series', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.status(201).json({
      series: { id: 3, name: 'New Admin Series', color: '#0000ff' }
    });
  });
  
  app.put('/api/admin/series/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({ message: 'Series updated successfully' });
  });
  
  app.delete('/api/admin/series/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({ message: 'Series deleted successfully' });
  });
  
  app.get('/api/admin/episodes', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json([
      { id: 1, title: 'Admin Episode 1', series_id: 1 },
      { id: 2, title: 'Admin Episode 2', series_id: 1 }
    ]);
  });
  
  app.post('/api/admin/episodes', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.status(201).json({
      episode: { id: 3, title: 'New Admin Episode', series_id: 1 }
    });
  });
  
  app.put('/api/admin/episodes/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({ message: 'Episode updated successfully' });
  });
  
  app.delete('/api/admin/episodes/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({ message: 'Episode deleted successfully' });
  });
  
  app.get('/api/admin-stats/stats', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== 'admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({
      total_users: 10,
      total_episodes: 50,
      total_series: 5
    });
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
  
  return app;
}

// Create and export the app instance
export const app = createTestApp();

export default app;

// Simple test to ensure the app is properly exported
import { test, expect } from '@jest/globals';

test('test app should be properly exported', () => {
  expect(app).toBeDefined();
  expect(typeof app.listen).toBe('function');
});

