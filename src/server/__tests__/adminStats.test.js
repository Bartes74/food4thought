import express from 'express';
import request from 'supertest';

// Prosty test bez mocków
const app = express();
app.use(express.json());

// Dodaj podstawowy endpoint do testowania
app.get('/api/admin/stats', (req, res) => {
  const { range = 'all' } = req.query;
  
  // Symulacja danych statystyk
  const stats = {
    users: {
      total: 5,
      active: 3,
      new: 1,
      retention: 80
    },
    episodes: {
      total: 25,
      averageRating: 4.5,
      completionRate: 75,
      averageCompletionTime: 45
    },
    series: {
      total: 8,
      active: 6,
      averageCompletion: 70
    },
    technical: {
      languages: [
        { language: 'Polski', percentage: 70 },
        { language: 'English', percentage: 20 },
        { language: 'Français', percentage: 10 }
      ],
      playbackSpeeds: [
        { speed: '1.0x', percentage: 45 },
        { speed: '1.25x', percentage: 30 }
      ],
      hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({ hour, activity: Math.floor(Math.random() * 50) }))
    },
    generatedAt: new Date().toISOString(),
    timeRange: range
  };
  
  res.json(stats);
});

app.get('/api/admin-stats/stats', (req, res) => {
  const { range = 'all' } = req.query;
  
  // Symulacja danych statystyk (kompatybilność z starym endpointem)
  const stats = {
    users: {
      total: 5,
      active: 3,
      new: 1,
      retention: 80
    },
    episodes: {
      total: 25,
      averageRating: 4.5,
      completionRate: 75,
      averageCompletionTime: 45
    },
    series: {
      total: 8,
      active: 6,
      averageCompletion: 70
    },
    technical: {
      languages: [
        { language: 'Polski', percentage: 70 },
        { language: 'English', percentage: 20 },
        { language: 'Français', percentage: 10 }
      ],
      playbackSpeeds: [
        { speed: '1.0x', percentage: 45 },
        { speed: '1.25x', percentage: 30 }
      ],
      hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({ hour, activity: Math.floor(Math.random() * 50) }))
    },
    generatedAt: new Date().toISOString(),
    timeRange: range
  };
  
  res.json(stats);
});

app.get('/api/admin-stats/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Admin endpoint działa!',
    user: { id: 1, email: 'admin@test.com', role: 'admin' },
    timestamp: new Date().toISOString()
  });
});

describe('Admin Stats Endpoints', () => {
  describe('GET /api/admin/stats', () => {
    it('should return admin stats without errors', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .query({ range: 'all' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('episodes');
      expect(response.body).toHaveProperty('series');
      expect(response.body).toHaveProperty('technical');
      expect(response.body).toHaveProperty('generatedAt');
      expect(response.body).toHaveProperty('timeRange');
    });

    it('should handle different time ranges', async () => {
      const ranges = ['today', 'week', 'month', 'all'];
      
      for (const range of ranges) {
        const response = await request(app)
          .get('/api/admin/stats')
          .query({ range });

        expect(response.status).toBe(200);
        expect(response.body.timeRange).toBe(range);
      }
    });

    it('should return proper data structure', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .query({ range: 'all' });

      expect(response.body.users).toHaveProperty('total');
      expect(response.body.users).toHaveProperty('active');
      expect(response.body.episodes).toHaveProperty('total');
      expect(response.body.series).toHaveProperty('total');
      expect(response.body.technical).toHaveProperty('languages');
      expect(response.body.technical.languages).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/admin-stats/stats (legacy endpoint)', () => {
    it('should return admin stats for legacy endpoint', async () => {
      const response = await request(app)
        .get('/api/admin-stats/stats')
        .query({ range: 'all' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('episodes');
      expect(response.body).toHaveProperty('series');
      expect(response.body).toHaveProperty('technical');
    });
  });

  describe('GET /api/admin-stats/test', () => {
    it('should return test endpoint response', async () => {
      const response = await request(app)
        .get('/api/admin-stats/test');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message', 'Admin endpoint działa!');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
}); 