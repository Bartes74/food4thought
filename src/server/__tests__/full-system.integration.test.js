import request from 'supertest';
import app from './test-app-simplified.js';
import fs from 'fs';
import path from 'path';

describe('Full System Integration Tests', () => {
  let adminToken = 'admin-token';
  let userToken = 'user-token';
  let userId = 2;
  let createdEpisodeId;
  let createdSeriesId;
  let testAudioFile;

  beforeAll(async () => {
    // Create a test audio file for upload tests
    const testAudioPath = path.join(process.cwd(), 'test-audio.mp3');
    testAudioFile = Buffer.from('fake MP3 audio data for testing purposes');
    
    // Ensure we have tokens for testing
    console.log('Setting up full system integration tests...');
  });

  afterAll(async () => {
    // Cleanup any created test files
    try {
      const testAudioPath = path.join(process.cwd(), 'test-audio.mp3');
      if (fs.existsSync(testAudioPath)) {
        fs.unlinkSync(testAudioPath);
      }
    } catch (error) {
      console.log('Cleanup completed');
    }
  });

  describe('Complete Application Workflow', () => {
    it('should complete full admin workflow: login -> create series -> create episode -> upload audio -> manage content', async () => {
      // Step 1: Admin Authentication
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@food4thought.local',
          password: 'admin'
        });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.role).toBe('super_admin');
      adminToken = loginResponse.body.token;

      // Step 2: Create Series
      const seriesResponse = await request(app)
        .post('/api/admin/series')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Integration Series',
          description: 'A series created during full system testing',
          color: '#FF5722',
          active: true
        });

      expect(seriesResponse.status).toBe(201);
      expect(seriesResponse.body).toHaveProperty('series');
      createdSeriesId = seriesResponse.body.series.id;

      // Step 3: Create Episode without Audio
      const episodeResponse = await request(app)
        .post('/api/episodes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Integration Test Episode')
        .field('series_id', createdSeriesId.toString())
        .field('language', 'polski')
        .field('additional_info', 'This episode was created during integration testing');

      expect(episodeResponse.status).toBe(201);
      expect(episodeResponse.body).toHaveProperty('episode');
      createdEpisodeId = episodeResponse.body.episode.id;

      // Step 4: Upload Audio to Episode
      const audioUploadResponse = await request(app)
        .post(`/api/episodes/${createdEpisodeId}/upload-audio`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('audio', testAudioFile, 'test-episode.mp3');

      expect(audioUploadResponse.status).toBe(200);
      expect(audioUploadResponse.body).toHaveProperty('message');

      // Step 5: Update Episode Metadata
      const updateResponse = await request(app)
        .put(`/api/episodes/${createdEpisodeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Integration Test Episode',
          language: 'angielski',
          additional_info: 'Updated during integration testing',
          topics_content: '[00:00] # Introduction\n- Welcome to integration testing\n\n[01:30] # Main Content\n- Testing full workflow'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.episode.title).toBe('Updated Integration Test Episode');

      // Step 6: Verify Episode Data
      const getEpisodeResponse = await request(app)
        .get(`/api/episodes/${createdEpisodeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getEpisodeResponse.status).toBe(200);
      expect(getEpisodeResponse.body.title).toBe('Updated Integration Test Episode');
      expect(getEpisodeResponse.body.language).toBe('angielski');
      expect(getEpisodeResponse.body).toHaveProperty('audioUrl');
    });

    it('should complete full user workflow: register -> login -> browse episodes -> interact with content', async () => {
      // Step 1: User Registration
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'integration.test@example.com',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body).toHaveProperty('user');

      // Step 2: User Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration.test@example.com',
          password: 'TestPassword123!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      userToken = loginResponse.body.token;
      userId = loginResponse.body.user.id;

      // Step 3: Browse User Episodes
      const episodesResponse = await request(app)
        .get('/api/episodes/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(episodesResponse.status).toBe(200);
      expect(episodesResponse.body).toHaveProperty('new');
      expect(episodesResponse.body).toHaveProperty('inProgress');
      expect(episodesResponse.body).toHaveProperty('completed');

      // Step 4: Get Episode Details
      if (createdEpisodeId) {
        const episodeDetailsResponse = await request(app)
          .get(`/api/episodes/${createdEpisodeId}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(episodeDetailsResponse.status).toBe(200);
        expect(episodeDetailsResponse.body).toHaveProperty('title');
        expect(episodeDetailsResponse.body).toHaveProperty('audioUrl');

        // Step 5: Add to Favorites
        const favoriteResponse = await request(app)
          .post(`/api/episodes/${createdEpisodeId}/favorite`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(favoriteResponse.status).toBe(200);
        expect(favoriteResponse.body.isFavorite).toBe(true);

        // Step 6: Rate Episode
        const ratingResponse = await request(app)
          .post(`/api/episodes/${createdEpisodeId}/rating`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ rating: 5 });

        expect(ratingResponse.status).toBe(200);

        // Step 7: Save Progress
        const progressResponse = await request(app)
          .post(`/api/episodes/${createdEpisodeId}/progress`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            position: 120,
            completed: false
          });

        expect(progressResponse.status).toBe(200);

        // Step 8: Mark as Completed
        const completeResponse = await request(app)
          .post(`/api/episodes/${createdEpisodeId}/progress`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            position: 1800,
            completed: true
          });

        expect(completeResponse.status).toBe(200);

        // Step 9: Verify Favorites
        const favoritesResponse = await request(app)
          .get('/api/episodes/favorites')
          .set('Authorization', `Bearer ${userToken}`);

        expect(favoritesResponse.status).toBe(200);
        expect(Array.isArray(favoritesResponse.body)).toBe(true);
        
        const favoriteEpisode = favoritesResponse.body.find(ep => ep.id === createdEpisodeId);
        expect(favoriteEpisode).toBeDefined();
        expect(favoriteEpisode.user_rating).toBe(5);
        expect(favoriteEpisode.user_completed).toBe(1);
      }
    });

    it('should test complete audio upload and management workflow', async () => {
      if (!createdEpisodeId) {
        console.log('Skipping audio test - no episode created');
        return;
      }

      // Step 1: Create Episode with Audio
      const episodeWithAudioResponse = await request(app)
        .post('/api/episodes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Audio Integration Test Episode')
        .field('series_id', createdSeriesId.toString())
        .field('language', 'polski')
        .attach('audio', testAudioFile, 'audio-test.mp3');

      expect(episodeWithAudioResponse.status).toBe(201);
      expect(episodeWithAudioResponse.body).toHaveProperty('hasAudioFile', true);

      const audioEpisodeId = episodeWithAudioResponse.body.episode.id;

      // Step 2: Verify Audio URL is Generated
      const audioEpisodeResponse = await request(app)
        .get(`/api/episodes/${audioEpisodeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(audioEpisodeResponse.status).toBe(200);
      expect(audioEpisodeResponse.body.audioUrl).toMatch(/^\/audio\/seria\d+\/polski\/.+\.mp3$/);

      // Step 3: Replace Audio File
      const replaceAudioResponse = await request(app)
        .post(`/api/episodes/${audioEpisodeId}/upload-audio`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('audio', testAudioFile, 'replaced-audio.mp3');

      expect(replaceAudioResponse.status).toBe(200);

      // Step 4: Test Episode Topics
      const topicsResponse = await request(app)
        .get(`/api/episodes/${audioEpisodeId}/topics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(topicsResponse.status).toBe(200);
      expect(topicsResponse.body).toHaveProperty('episodeId', audioEpisodeId);
    });

    it('should test user statistics and achievements workflow', async () => {
      // Step 1: Record Listening Session
      const sessionResponse = await request(app)
        .post('/api/achievements/record-session')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          episodeId: createdEpisodeId,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 60000).toISOString(),
          playbackSpeed: 1.0,
          completionRate: 0.95,
          durationSeconds: 60
        });

      expect(sessionResponse.status).toBe(200);

      // Step 2: Check User Statistics
      const userStatsResponse = await request(app)
        .get(`/api/users/${userId}/stats`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(userStatsResponse.status).toBe(200);
      expect(userStatsResponse.body).toHaveProperty('seriesStats');

      // Step 3: Check Achievements
      const achievementsResponse = await request(app)
        .post('/api/achievements/check')
        .set('Authorization', `Bearer ${userToken}`);

      expect(achievementsResponse.status).toBe(200);

      // Step 4: Get User History
      const historyResponse = await request(app)
        .get(`/api/users/${userId}/history`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(historyResponse.status).toBe(200);

      // Step 5: Get User Patterns
      const patternsResponse = await request(app)
        .get(`/api/users/${userId}/patterns`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(patternsResponse.status).toBe(200);
    });

    it('should test admin statistics and management workflow', async () => {
      // Step 1: Get Admin Statistics
      const adminStatsResponse = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ range: 'all' });

      expect(adminStatsResponse.status).toBe(200);
      expect(adminStatsResponse.body).toHaveProperty('users');
      expect(adminStatsResponse.body).toHaveProperty('episodes');
      expect(adminStatsResponse.body).toHaveProperty('series');
      expect(adminStatsResponse.body).toHaveProperty('technical');

      // Step 2: Get All Episodes (Admin View)
      const allEpisodesResponse = await request(app)
        .get('/api/admin/episodes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(allEpisodesResponse.status).toBe(200);
      expect(Array.isArray(allEpisodesResponse.body)).toBe(true);

      // Step 3: Get All Series (Admin View)
      const allSeriesResponse = await request(app)
        .get('/api/admin/series')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(allSeriesResponse.status).toBe(200);
      expect(Array.isArray(allSeriesResponse.body)).toBe(true);

      // Step 4: Get All Users (Admin View)
      const allUsersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(allUsersResponse.status).toBe(200);
      expect(Array.isArray(allUsersResponse.body)).toBe(true);
    });

    it('should test data consistency and persistence across operations', async () => {
      // Step 1: Verify Episode Still Exists with All Data
      const episodeCheckResponse = await request(app)
        .get(`/api/episodes/${createdEpisodeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(episodeCheckResponse.status).toBe(200);
      expect(episodeCheckResponse.body.title).toBe('Updated Integration Test Episode');
      expect(episodeCheckResponse.body.user_rating).toBe(5);
      expect(episodeCheckResponse.body.user_completed).toBe(1);
      expect(episodeCheckResponse.body.is_favorite).toBe(true);

      // Step 2: Verify Series Data Consistency
      const seriesCheckResponse = await request(app)
        .get(`/api/admin/series/${createdSeriesId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(seriesCheckResponse.status).toBe(200);
      expect(seriesCheckResponse.body.name).toBe('Test Integration Series');

      // Step 3: Verify User Data Persistence
      const userProfileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(userProfileResponse.status).toBe(200);
      expect(userProfileResponse.body.email).toBe('integration.test@example.com');

      // Step 4: Test Cross-Reference Data Integrity
      const topRatedResponse = await request(app)
        .get('/api/episodes/my/top-rated')
        .set('Authorization', `Bearer ${userToken}`);

      expect(topRatedResponse.status).toBe(200);
      expect(Array.isArray(topRatedResponse.body)).toBe(true);
      
      const topRatedEpisode = topRatedResponse.body.find(ep => ep.id === createdEpisodeId);
      if (topRatedEpisode) {
        expect(topRatedEpisode.rating).toBe(5);
      }
    });

    it('should test error handling and edge cases', async () => {
      // Step 1: Test Unauthorized Access
      const unauthorizedResponse = await request(app)
        .get('/api/admin/stats');

      expect(unauthorizedResponse.status).toBe(401);

      // Step 2: Test Non-existent Resource
      const notFoundResponse = await request(app)
        .get('/api/episodes/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(notFoundResponse.status).toBe(404);

      // Step 3: Test Invalid Data
      const invalidEpisodeResponse = await request(app)
        .post('/api/episodes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '', // Empty title should fail
          series_id: 'invalid'
        });

      expect(invalidEpisodeResponse.status).toBe(400);

      // Step 4: Test File Upload Limits (would normally test with large file)
      const noFileResponse = await request(app)
        .post(`/api/episodes/${createdEpisodeId}/upload-audio`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(noFileResponse.status).toBe(400);

      // Step 5: Test Rating Boundaries
      const invalidRatingResponse = await request(app)
        .post(`/api/episodes/${createdEpisodeId}/rating`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 10 }); // Rating should be 1-5

      expect(invalidRatingResponse.status).toBe(400);
    });

    it('should cleanup test data', async () => {
      // Step 1: Remove from Favorites
      if (createdEpisodeId) {
        const removeFavoriteResponse = await request(app)
          .delete(`/api/episodes/${createdEpisodeId}/favorite`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(removeFavoriteResponse.status).toBe(200);
      }

      // Step 2: Delete Episode
      if (createdEpisodeId) {
        const deleteEpisodeResponse = await request(app)
          .delete(`/api/episodes/${createdEpisodeId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteEpisodeResponse.status).toBe(200);
      }

      // Step 3: Delete Series
      if (createdSeriesId) {
        const deleteSeriesResponse = await request(app)
          .delete(`/api/admin/series/${createdSeriesId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteSeriesResponse.status).toBe(200);
      }

      // Step 4: Verify Cleanup
      if (createdEpisodeId) {
        const verifyDeleteResponse = await request(app)
          .get(`/api/episodes/${createdEpisodeId}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(verifyDeleteResponse.status).toBe(404);
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = [];
      
      // Create 10 concurrent requests to different endpoints
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/episodes/my')
            .set('Authorization', `Bearer ${userToken}`)
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain response time standards', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/episodes/my')
        .set('Authorization', `Bearer ${userToken}`);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});
