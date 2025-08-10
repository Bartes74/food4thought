import request from 'supertest';
import app from './test-app-simplified.js';

describe('Admin Integration Tests', () => {
  describe('GET /api/admin/users', () => {
    it('should return all users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user role for admin', async () => {
      const response = await request(app)
        .put('/api/admin/users/1')
        .set('Authorization', 'Bearer admin-token')
        .send({
          role: 'user'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/api/admin/users/1')
        .send({
          role: 'user'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .put('/api/admin/users/1')
        .set('Authorization', 'Bearer user-token')
        .send({
          role: 'user'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user for admin', async () => {
      const response = await request(app)
        .delete('/api/admin/users/1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/admin/users/1');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete('/api/admin/users/1')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/series', () => {
    it('should return all series for admin', async () => {
      const response = await request(app)
        .get('/api/admin/series')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/admin/series');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/series')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/admin/series', () => {
    it('should create new series for admin', async () => {
      const response = await request(app)
        .post('/api/admin/series')
        .set('Authorization', 'Bearer admin-token')
        .field('name', 'New Test Series')
        .field('description', 'Test series description')
        .field('color', '#ff0000');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('series');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/admin/series')
        .field('name', 'New Test Series')
        .field('description', 'Test series description')
        .field('color', '#ff0000');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/api/admin/series')
        .set('Authorization', 'Bearer user-token')
        .field('name', 'New Test Series')
        .field('description', 'Test series description')
        .field('color', '#ff0000');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/admin/series/:id', () => {
    it('should update series for admin', async () => {
      const response = await request(app)
        .put('/api/admin/series/1')
        .set('Authorization', 'Bearer admin-token')
        .field('name', 'Updated Test Series')
        .field('description', 'Updated description')
        .field('color', '#00ff00');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/api/admin/series/1')
        .field('name', 'Updated Test Series')
        .field('description', 'Updated description')
        .field('color', '#00ff00');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .put('/api/admin/series/1')
        .set('Authorization', 'Bearer user-token')
        .field('name', 'Updated Test Series')
        .field('description', 'Updated description')
        .field('color', '#00ff00');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/admin/series/:id', () => {
    it('should delete series for admin', async () => {
      const response = await request(app)
        .delete('/api/admin/series/1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/admin/series/1');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete('/api/admin/series/1')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/episodes', () => {
    it('should return all episodes for admin', async () => {
      const response = await request(app)
        .get('/api/admin/episodes')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/admin/episodes');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/episodes')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/admin/episodes', () => {
    it('should create new episode for admin', async () => {
      const response = await request(app)
        .post('/api/admin/episodes')
        .set('Authorization', 'Bearer admin-token')
        .field('title', 'New Test Episode')
        .field('series_id', '1')
        .field('additional_info', 'Test episode info');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('episode');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/admin/episodes')
        .field('title', 'New Test Episode')
        .field('series_id', '1')
        .field('additional_info', 'Test episode info');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/api/admin/episodes')
        .set('Authorization', 'Bearer user-token')
        .field('title', 'New Test Episode')
        .field('series_id', '1')
        .field('additional_info', 'Test episode info');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/admin/episodes/:id', () => {
    it('should update episode for admin', async () => {
      const response = await request(app)
        .put('/api/admin/episodes/1')
        .set('Authorization', 'Bearer admin-token')
        .field('title', 'Updated Test Episode')
        .field('series_id', '1')
        .field('additional_info', 'Updated episode info');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/api/admin/episodes/1')
        .field('title', 'Updated Test Episode')
        .field('series_id', '1')
        .field('additional_info', 'Updated episode info');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .put('/api/admin/episodes/1')
        .set('Authorization', 'Bearer user-token')
        .field('title', 'Updated Test Episode')
        .field('series_id', '1')
        .field('additional_info', 'Updated episode info');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/admin/episodes/:id', () => {
    it('should delete episode for admin', async () => {
      const response = await request(app)
        .delete('/api/admin/episodes/1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/admin/episodes/1');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete('/api/admin/episodes/1')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 