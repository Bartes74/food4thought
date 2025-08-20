import request from 'supertest';
import app from './test-app-simplified.js';

describe('Simple Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Authentication', () => {
    it('should login admin successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@food4thought.local',
          password: 'admin'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'admin@food4thought.local');
      expect(response.body.user).toHaveProperty('role', 'super_admin');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('User Registration', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: 'newuser3@example.com',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('role', 'user');
    });

    it('should return 400 for password mismatch', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'mismatch@example.com',
          password: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('User Statistics', () => {
    it('should return series statistics for authenticated user', async () => {
      const response = await request(app)
        .get('/api/users/2/stats')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('seriesStats');
      expect(Array.isArray(response.body.seriesStats)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users/2/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('Achievements', () => {
    it('should return user achievements for authenticated user', async () => {
      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/achievements');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Admin Statistics', () => {
    it('should return admin statistics for super admin', async () => {
      const response = await request(app)
        .get('/api/admin-stats/stats')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/admin-stats/stats');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 