import request from 'supertest';
import app from './test-app-simplified.js';

describe('Integration Tests', () => {
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
      expect(response.body.user).toHaveProperty('role', 'super_admin');
    });

    it('should login test user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('role', 'user');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
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
          email: 'newuser@example.com',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
    });

    it('should reject registration with mismatched passwords', async () => {
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

    it('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@food4thought.local',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Series Endpoints', () => {
    it('should return all series for authenticated user', async () => {
      const response = await request(app)
        .get('/api/series')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 for unauthenticated series request', async () => {
      const response = await request(app)
        .get('/api/series');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Episodes Endpoints', () => {
    it('should return user episodes with proper structure', async () => {
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

    it('should return favorites for authenticated user', async () => {
      const response = await request(app)
        .get('/api/episodes/favorites')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return top-rated episodes for user', async () => {
      const response = await request(app)
        .get('/api/episodes/my/top-rated')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('User Statistics', () => {
    it('should return user statistics', async () => {
      const response = await request(app)
        .get('/api/users/2/stats')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_episodes');
      expect(response.body).toHaveProperty('completed_episodes');
      expect(response.body).toHaveProperty('favorite_episodes');
    });

    it('should include series statistics in user stats', async () => {
      const response = await request(app)
        .get('/api/users/2/stats')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('seriesStats');
      expect(Array.isArray(response.body.seriesStats)).toBe(true);
    });
  });

  describe('Achievements', () => {
    it('should return user achievements', async () => {
      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const achievement = response.body[0];
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('category');
        expect(achievement).toHaveProperty('progress');
        expect(achievement).toHaveProperty('completed');
      }
    });

    it('should record listening session for achievements', async () => {
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
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated record-session request', async () => {
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
        .send(sessionData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return achievements with categories', async () => {
      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const achievement = response.body[0];
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('category');
        expect(achievement).toHaveProperty('progress');
        expect(achievement).toHaveProperty('completed');
      }
    });
  });
}); 