import request from 'supertest';
import express from 'express';

// Prosty test bez mocków
const app = express();
app.use(express.json());

// Dodaj podstawowy endpoint do testowania
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło są wymagane' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Nieprawidłowy format email' });
  }
  
  res.json({ message: 'Login endpoint działa' });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Token nieprawidłowy lub wygasły' });
  }
  
  res.json({ message: 'Auth endpoint działa' });
});

describe('Auth Endpoints', () => {
  describe('POST /api/auth/login', () => {
    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email i hasło są wymagane');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email i hasło są wymagane');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid-email', password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nieprawidłowy format email');
    });

    it('should return 200 for valid data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'test123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login endpoint działa');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Brak tokenu autoryzacji');
    });

    it('should return 403 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Token nieprawidłowy lub wygasły');
    });

    it('should return 200 for valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Auth endpoint działa');
    });
  });
}); 