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
    res.json({ status: 'ok' });
  });
  
  // Test database endpoint
  app.get('/api/test-db', (req, res) => {
    res.json({ result: 1 });
  });
  
  // Auth endpoints for testing
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@food4thought.local' && password === 'admin123') {
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
    
    res.status(201).json({
      message: 'User created successfully',
      user: { id: 3, email, role: 'user' }
    });
  });
  
  // Series endpoints for testing
  app.post('/api/series', (req, res) => {
    res.status(201).json({
      series: { id: 1, name: 'Test Series' }
    });
  });
  
  // Episodes endpoints for testing
  app.post('/api/episodes', (req, res) => {
    res.status(201).json({
      episode: { id: 1, title: 'Test Episode' }
    });
  });
  
  return app;
}

// Create and export the app instance
export const app = createTestApp();

export default app;

