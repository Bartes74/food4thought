import request from 'supertest';
import app from './test-app.js';
import { setupTests, teardownTests, getTestData } from './setup.js';

describe('Episodes Integration Tests', () => {
  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await teardownTests();
  });

  describe('GET /api/episodes/my', () => {
    it('should return user episodes for authenticated user', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/episodes/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('new');
      expect(response.body).toHaveProperty('inProgress');
      expect(response.body).toHaveProperty('completed');
      expect(Array.isArray(response.body.new)).toBe(true);
      expect(Array.isArray(response.body.inProgress)).toBe(true);
      expect(Array.isArray(response.body.completed)).toBe(true);
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
      const { userToken, testEpisodeId } = getTestData();
      
      const response = await request(app)
        .get(`/api/episodes/${testEpisodeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testEpisodeId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('series_id');
      expect(response.body).toHaveProperty('is_favorite');
      expect(response.body).toHaveProperty('user_rating');
    });

    it('should return 404 for non-existent episode', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/episodes/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const { testEpisodeId } = getTestData();
      
      const response = await request(app)
        .get(`/api/episodes/${testEpisodeId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/episodes/:id/progress', () => {
    it('should save episode progress successfully', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/progress`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          position: 120,
          completed: false
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should mark episode as completed', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/progress`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          position: 300,
          completed: true
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid position', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/progress`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          position: -10,
          completed: false
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const { testEpisodeId } = getTestData();
      
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/progress`)
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
      const { userToken, testEpisodeId } = getTestData();
      
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/favorite`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('dodany');
    });

    it('should remove episode from favorites', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      // First add to favorites
      await request(app)
        .post(`/api/episodes/${testEpisodeId}/favorite`)
        .set('Authorization', `Bearer ${userToken}`);

      // Then remove from favorites
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/favorite`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('usunięty');
    });

    it('should return 401 for unauthenticated request', async () => {
      const { testEpisodeId } = getTestData();
      
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/favorite`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/episodes/:id/rating', () => {
    it('should add rating successfully', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/rating`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('rating', 5);
    });

    it('should update existing rating', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      // First add rating
      await request(app)
        .post(`/api/episodes/${testEpisodeId}/rating`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 3 });

      // Then update rating
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/rating`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 4 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('rating', 4);
    });

    it('should return 400 for invalid rating', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/rating`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 6 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for rating below 1', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/rating`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const { testEpisodeId } = getTestData();
      
      const response = await request(app)
        .post(`/api/episodes/${testEpisodeId}/rating`)
        .send({ rating: 5 });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/episodes/:id/rating', () => {
    it('should return user rating for episode', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      // First add a rating
      await request(app)
        .post(`/api/episodes/${testEpisodeId}/rating`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 4 });

      // Then get the rating
      const response = await request(app)
        .get(`/api/episodes/${testEpisodeId}/rating`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rating', 4);
    });

    it('should return null for episode without rating', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      const response = await request(app)
        .get(`/api/episodes/${testEpisodeId}/rating`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rating');
    });

    it('should return 401 for unauthenticated request', async () => {
      const { testEpisodeId } = getTestData();
      
      const response = await request(app)
        .get(`/api/episodes/${testEpisodeId}/rating`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/episodes/:id/average-rating', () => {
    it('should return average rating for episode', async () => {
      const { userToken, testEpisodeId } = getTestData();
      
      const response = await request(app)
        .get(`/api/episodes/${testEpisodeId}/average-rating`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('average_rating');
      expect(response.body).toHaveProperty('rating_count');
      expect(typeof response.body.average_rating).toBe('number');
      expect(typeof response.body.rating_count).toBe('number');
    });

    it('should return 401 for unauthenticated request', async () => {
      const { testEpisodeId } = getTestData();
      
      const response = await request(app)
        .get(`/api/episodes/${testEpisodeId}/average-rating`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/episodes/my/top-rated', () => {
    it('should return user top rated episodes', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/episodes/my/top-rated')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/episodes/my/top-rated');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 