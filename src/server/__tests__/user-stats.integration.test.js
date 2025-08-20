import request from 'supertest';
import app from './test-app-simplified.js';

describe('User Stats Integration Tests', () => {
  describe('GET /api/users/:id/stats', () => {
    it('should return user statistics for authenticated user', async () => {
      const response = await request(app)
        .get('/api/users/2/stats')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users/2/stats');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for accessing other user stats', async () => {
      const response = await request(app)
        .get('/api/users/999/stats')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should include seriesStats inside stats payload', async () => {
      const response = await request(app)
        .get('/api/users/2/stats')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('seriesStats');
      expect(Array.isArray(response.body.seriesStats)).toBe(true);
    });
  });

  describe('GET /api/users/:id/favorites', () => {
    it('should return user favorites for authenticated user', async () => {
      const response = await request(app)
        .get('/api/users/2/favorites')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users/2/favorites');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for accessing other user favorites', async () => {
      const response = await request(app)
        .get('/api/users/999/favorites')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/achievements/check', () => {
    it('should check and award achievements for authenticated user', async () => {
      const response = await request(app)
        .post('/api/achievements/check')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/achievements/check');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/:id/history', () => {
    it('should return user listening history for authenticated user', async () => {
      const response = await request(app)
        .get('/api/users/2/history')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users/2/history');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for accessing other user history', async () => {
      const response = await request(app)
        .get('/api/users/999/history')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/:id/patterns', () => {
    it('should return user listening patterns for authenticated user', async () => {
      const response = await request(app)
        .get('/api/users/2/patterns')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users/2/patterns');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for accessing other user patterns', async () => {
      const response = await request(app)
        .get('/api/users/999/patterns')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('User Stats with avg_completion', () => {
    it('should include avg_completion in user statistics', async () => {
      const response = await request(app)
        .get('/api/users/2/stats')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_listening_time');
      expect(response.body).toHaveProperty('episodes_completed');
      expect(response.body).toHaveProperty('achievements_earned');
      expect(response.body).toHaveProperty('avg_completion');
      expect(typeof response.body.avg_completion).toBe('number');
    });

    it('should handle avg_completion updates', async () => {
      // Test rejestrowania sesji z completion_rate
      const sessionData = {
        episodeId: 1,
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-01T00:01:00Z',
        playbackSpeed: 1.0,
        completionRate: 0.95,
        durationSeconds: 60
      };

      const response = await request(app)
        .post('/api/achievements/record-session')
        .set('Authorization', 'Bearer user-token')
        .send(sessionData);

      expect(response.status).toBe(200);
    });
  });
}); 