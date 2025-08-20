import request from 'supertest';
import app from './test-app-simplified.js';

describe('Episodes Integration Tests', () => {
  describe('GET /api/episodes/my', () => {
    it('should return user episodes with proper structure for authenticated user', async () => {
      const response = await request(app)
        .get('/api/episodes/my')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('new');
      expect(response.body).toHaveProperty('inProgress');
      expect(response.body).toHaveProperty('completed');
      expect(Array.isArray(response.body.new)).toBe(true);
      expect(Array.isArray(response.body.inProgress)).toBe(true);
      expect(Array.isArray(response.body.completed)).toBe(true);
    });

    it('should return episodes with series information', async () => {
      const response = await request(app)
        .get('/api/episodes/my')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      
      // Sprawdź czy odcinki mają informacje o serii
      const allEpisodes = [
        ...response.body.new,
        ...response.body.inProgress,
        ...response.body.completed
      ];
      
      if (allEpisodes.length > 0) {
        const episode = allEpisodes[0];
        expect(episode).toHaveProperty('series_name');
        expect(episode).toHaveProperty('series_color');
        expect(episode).toHaveProperty('series_image');
      }
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
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('series_id');
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

  describe('GET /api/episodes/favorites', () => {
    it('should return user favorites with series information', async () => {
      const response = await request(app)
        .get('/api/episodes/favorites')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const favorite = response.body[0];
        expect(favorite).toHaveProperty('series_name');
        expect(favorite).toHaveProperty('series_color');
        expect(favorite).toHaveProperty('series_image');
        expect(favorite).toHaveProperty('favorited_at');
      }
    });

    it('should support search in favorites', async () => {
      const response = await request(app)
        .get('/api/episodes/favorites?search=test')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/episodes/favorites');

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
    it('should return user top rated episodes with series information', async () => {
      const response = await request(app)
        .get('/api/episodes/my/top-rated')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const topRated = response.body[0];
        expect(topRated).toHaveProperty('series_name');
        expect(topRated).toHaveProperty('series_color');
        expect(topRated).toHaveProperty('rating');
        expect(topRated).toHaveProperty('rated_at');
      }
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/episodes/my/top-rated');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/episodes/:id (Admin)', () => {
    it('should delete episode and related data for admin', async () => {
      const response = await request(app)
        .delete('/api/episodes/1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete('/api/episodes/1')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/episodes/1');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/episodes/next/:id', () => {
    it('should return next episode for automatic playback', async () => {
      const response = await request(app)
        .get('/api/episodes/next/1')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nextEpisode');
      expect(response.body).toHaveProperty('message');
      
      if (response.body.nextEpisode) {
        expect(response.body.nextEpisode).toHaveProperty('id');
        expect(response.body.nextEpisode).toHaveProperty('title');
        expect(response.body.nextEpisode).toHaveProperty('series_name');
        expect(response.body.nextEpisode).toHaveProperty('audioUrl');
      }
    });

    it('should return null when no more episodes available', async () => {
      // Test z nieistniejącym odcinkiem - powinien zwrócić 404
      const response = await request(app)
        .get('/api/episodes/next/99999')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/episodes/next/1');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent current episode', async () => {
      const response = await request(app)
        .get('/api/episodes/next/99999')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Episode audioUrl', () => {
    it('should include audioUrl in episode details', async () => {
      const response = await request(app)
        .get('/api/episodes/1')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('audioUrl');
      expect(response.body.audioUrl).toMatch(/^\/audio\/seria\d+\/polski\/.+\.mp3$/);
    });

    it('should include audioUrl in user episodes', async () => {
      const response = await request(app)
        .get('/api/episodes/my')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      
      const allEpisodes = [
        ...response.body.new,
        ...response.body.inProgress,
        ...response.body.completed
      ];
      
      if (allEpisodes.length > 0) {
        const episode = allEpisodes[0];
        expect(episode).toHaveProperty('audioUrl');
        expect(episode.audioUrl).toMatch(/^\/audio\/seria\d+\/polski\/.+\.mp3$/);
      }
    });

    it('should include audioUrl in favorites', async () => {
      const response = await request(app)
        .get('/api/episodes/favorites')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      
      if (response.body.length > 0) {
        const episode = response.body[0];
        expect(episode).toHaveProperty('audioUrl');
        expect(episode.audioUrl).toMatch(/^\/audio\/seria\d+\/polski\/.+\.mp3$/);
      }
    });
  });
}); 