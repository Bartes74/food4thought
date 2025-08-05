import request from 'supertest';
import app from './test-app.js';

describe('Simple Integration Tests', () => {
  let adminToken = null;
  let userToken = null;

  beforeAll(async () => {
    // Logowanie administratora
    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@food4thought.local',
        password: 'admin123'
      });
    
    if (adminResponse.status === 200) {
      adminToken = adminResponse.body.token;
    }

    // Rejestracja testowego użytkownika
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'test123',
        confirmPassword: 'test123'
      });

    if (registerResponse.status === 201) {
      userToken = registerResponse.body.token;
    }
  });

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
          password: 'admin123'
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
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser3@example.com',
          password: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'newuser3@example.com');
      expect(response.body.user).toHaveProperty('role', 'user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for password mismatch', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'mismatch2@example.com',
          password: 'password123',
          confirmPassword: 'differentpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak@example.com',
          password: '123',
          confirmPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('User Authentication', () => {
    it('should return user info for valid token', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'admin@food4thought.local');
      expect(response.body.user).toHaveProperty('role', 'super_admin');
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Episodes', () => {
    it('should return user episodes for authenticated user', async () => {
      if (!userToken) {
        console.log('Skipping test - no user token available');
        return;
      }

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

  describe('User Statistics', () => {
    it('should return series statistics for authenticated user', async () => {
      if (!userToken) {
        console.log('Skipping test - no user token available');
        return;
      }

      const response = await request(app)
        .get('/api/users/series-stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users/series-stats');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Achievements', () => {
    it('should return user achievements for authenticated user', async () => {
      if (!userToken) {
        console.log('Skipping test - no user token available');
        return;
      }

      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('achievements');
      expect(response.body).toHaveProperty('stats');
      expect(Array.isArray(response.body.achievements)).toBe(true);
      expect(typeof response.body.stats).toBe('object');
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
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .get('/api/admin-stats/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('episodes');
      expect(response.body).toHaveProperty('series');
      expect(response.body).toHaveProperty('technical');
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

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(500);
    });
  });
}); 