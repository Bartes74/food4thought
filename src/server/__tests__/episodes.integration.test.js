import request from 'supertest';
import app from './test-app-simplified.js';

describe('Episodes Integration Tests', () => {
  describe('GET /api/episodes/my', () => {
    it('should return user episodes for authenticated user', async () => {
      const response = await request(app)
        .get('/api/episodes/my')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/episodes/my');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/episodes/:id', () => {
    it('should return episode details for authenticated user', async () => {
      const response = await request(app)
        .get('/api/episodes/1')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent episode', async () => {
      const response = await request(app)
        .get('/api/episodes/99999')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/episodes/1');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/episodes/:id/progress', () => {
    it('should save episode progress successfully', async () => {
      const response = await request(app)
        .post('/api/episodes/1/progress')
        .set('Authorization', 'Bearer user-token')
        .send({
          position: 120,
          completed: false
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should mark episode as completed', async () => {
      const response = await request(app)
        .post('/api/episodes/1/progress')
        .set('Authorization', 'Bearer user-token')
        .send({
          position: 3600,
          completed: true
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/episodes/1/progress')
        .send({
          position: 120,
          completed: false
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/episodes/:id/favorite', () => {
    it('should add episode to favorites', async () => {
      const response = await request(app)
        .post('/api/episodes/1/favorite')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/episodes/1/favorite');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/episodes/:id/favorite', () => {
    it('should remove episode from favorites', async () => {
      const response = await request(app)
        .delete('/api/episodes/1/favorite')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/episodes/1/favorite');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/episodes/:id/rating', () => {
    it('should rate episode successfully', async () => {
      const response = await request(app)
        .post('/api/episodes/1/rating')
        .set('Authorization', 'Bearer user-token')
        .send({ rating: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid rating', async () => {
      const response = await request(app)
        .post('/api/episodes/1/rating')
        .set('Authorization', 'Bearer user-token')
        .send({ rating: 6 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/episodes/1/rating')
        .send({ rating: 5 });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/episodes/:id/rating', () => {
    it('should return user rating for episode', async () => {
      const response = await request(app)
        .get('/api/episodes/1/rating')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rating');
    });

    it('should return null for episode without rating', async () => {
      const response = await request(app)
        .get('/api/episodes/2/rating')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rating');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/episodes/1/rating');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/episodes/:id/average-rating', () => {
    it('should return average rating for episode', async () => {
      const response = await request(app)
        .get('/api/episodes/1/average-rating')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('average_rating');
      expect(response.body).toHaveProperty('rating_count');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/episodes/1/average-rating');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/episodes/my/top-rated', () => {
    it('should return user top rated episodes', async () => {
      const response = await request(app)
        .get('/api/episodes/my/top-rated')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/episodes/my/top-rated');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 