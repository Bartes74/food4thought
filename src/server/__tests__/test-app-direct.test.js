// Direct test of the test-app.js file
import request from 'supertest';
import app from './test-app-simplified.js';

describe('Test App Direct Tests', () => {
  test('should return 200 for health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });

  test('should return 404 for non-existent route', async () => {
    const response = await request(app).get('/non-existent-route');
    expect(response.status).toBe(404);
  });
});
