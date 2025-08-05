import request from 'supertest';
import app from './test-app.js';
import { setupTests, teardownTests, getTestData } from './setup.js';

describe('Admin Integration Tests', () => {
  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await teardownTests();
  });

  describe('GET /api/admin/stats', () => {
    it('should return admin statistics for super admin', async () => {
      const { adminToken } = getTestData();
      
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userStats');
      expect(response.body).toHaveProperty('episodeStats');
      expect(response.body).toHaveProperty('seriesStats');
      expect(response.body).toHaveProperty('systemStats');
      
      // Sprawdź strukturę userStats
      expect(response.body.userStats).toHaveProperty('totalUsers');
      expect(response.body.userStats).toHaveProperty('activeUsers');
      expect(response.body.userStats).toHaveProperty('newUsersThisWeek');
      expect(typeof response.body.userStats.totalUsers).toBe('number');
      
      // Sprawdź strukturę episodeStats
      expect(response.body.episodeStats).toHaveProperty('totalEpisodes');
      expect(response.body.episodeStats).toHaveProperty('completedEpisodes');
      expect(response.body.episodeStats).toHaveProperty('topPopular');
      expect(response.body.episodeStats).toHaveProperty('mostAbandoned');
      expect(typeof response.body.episodeStats.totalEpisodes).toBe('number');
      expect(Array.isArray(response.body.episodeStats.topPopular)).toBe(true);
      expect(Array.isArray(response.body.episodeStats.mostAbandoned)).toBe(true);
      
      // Sprawdź strukturę seriesStats
      expect(response.body.seriesStats).toHaveProperty('totalSeries');
      expect(response.body.seriesStats).toHaveProperty('activeSeries');
      expect(response.body.seriesStats).toHaveProperty('details');
      expect(typeof response.body.seriesStats.totalSeries).toBe('number');
      expect(Array.isArray(response.body.seriesStats.details)).toBe(true);
    });

    it('should return 403 for regular user', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/admin/stats');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return all users for super admin', async () => {
      const { adminToken } = getTestData();
      
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const user = response.body[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('created_at');
        expect(user).not.toHaveProperty('password_hash');
      }
    });

    it('should return 403 for regular user', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create new user for super admin', async () => {
      const { adminToken } = getTestData();
      
      const newUser = {
        email: 'admincreated@example.com',
        password: 'password123',
        role: 'user'
      };
      
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', newUser.email);
      expect(response.body.user).toHaveProperty('role', newUser.role);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for duplicate email', async () => {
      const { adminToken } = getTestData();
      
      const duplicateUser = {
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };
      
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid role', async () => {
      const { adminToken } = getTestData();
      
      const invalidUser = {
        email: 'invalidrole@example.com',
        password: 'password123',
        role: 'invalid_role'
      };
      
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for regular user', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should update user role for super admin', async () => {
      const { adminToken, testUserId } = getTestData();
      
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid role', async () => {
      const { adminToken, testUserId } = getTestData();
      
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid_role' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for changing own role', async () => {
      const { adminToken } = getTestData();
      
      const response = await request(app)
        .put('/api/admin/users/1/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for regular user', async () => {
      const { userToken, testUserId } = getTestData();
      
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/admin/users/:id/reset-password', () => {
    it('should reset user password for admin', async () => {
      const { adminToken, testUserId } = getTestData();
      
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('newPassword');
      expect(typeof response.body.newPassword).toBe('string');
      expect(response.body.newPassword.length).toBeGreaterThan(0);
    });

    it('should return 400 for resetting own password', async () => {
      const { adminToken } = getTestData();
      
      const response = await request(app)
        .post('/api/admin/users/1/reset-password')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for regular user', async () => {
      const { userToken, testUserId } = getTestData();
      
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/reset-password`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user for super admin', async () => {
      const { adminToken } = getTestData();
      
      // First create a user to delete
      const createResponse = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'todelete@example.com',
          password: 'password123',
          role: 'user'
        });

      const userIdToDelete = createResponse.body.user.id;
      
      const response = await request(app)
        .delete(`/api/admin/users/${userIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for deleting own account', async () => {
      const { adminToken } = getTestData();
      
      const response = await request(app)
        .delete('/api/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for regular user', async () => {
      const { userToken, testUserId } = getTestData();
      
      const response = await request(app)
        .delete(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/series', () => {
    it('should return all series for admin', async () => {
      const { adminToken } = getTestData();
      
      const response = await request(app)
        .get('/api/admin/series')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const series = response.body[0];
        expect(series).toHaveProperty('id');
        expect(series).toHaveProperty('name');
        expect(series).toHaveProperty('description');
        expect(series).toHaveProperty('color');
        expect(series).toHaveProperty('active');
      }
    });

    it('should return 403 for regular user', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/admin/series')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/episodes', () => {
    it('should return all episodes for admin', async () => {
      const { adminToken } = getTestData();
      
      const response = await request(app)
        .get('/api/admin/episodes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const episode = response.body[0];
        expect(episode).toHaveProperty('id');
        expect(episode).toHaveProperty('title');
        expect(episode).toHaveProperty('series_id');
        expect(episode).toHaveProperty('filename');
      }
    });

    it('should return 403 for regular user', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/admin/episodes')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 