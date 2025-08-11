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
  });

  describe('GET /api/users/series-stats', () => {
    it('should return series statistics for authenticated user', async () => {
      const response = await request(app)
        .get('/api/users/series-stats')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users/series-stats');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
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
}); 