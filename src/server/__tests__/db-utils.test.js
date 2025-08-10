// Test for database utility functions
import { withDb, queryDb, insertTestUser, clearTestData } from './db-utils.js';

describe('Database Utilities', () => {
  beforeEach(async () => {
    // Clear all test data before each test
    try {
      await clearTestData();
    } catch (error) {
      console.log('Warning: Could not clear test data:', error.message);
    }
  });

  test('withDb provides a working database connection', async () => {
    await withDb(async (db) => {
      return new Promise((resolve, reject) => {
        getDb().get('SELECT 1 as test', (err, row) => {
          if (err) return reject(err);
          expect(row.test).toBe(1);
          resolve();
        });
      });
    });
  });

  test('queryDb executes a query and returns results', async () => {
    const result = await queryDb('SELECT 1 as test');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].test).toBe(1);
  });

  test('insertTestUser inserts a test user', async () => {
    const userId = await insertTestUser({
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'user'
    });
    
    expect(userId).toBeDefined();
    
    // Verify the user was inserted
    const users = await queryDb('SELECT * FROM users WHERE id = ?', [userId]);
    expect(users.length).toBe(1);
    expect(users[0].email).toBe('test@example.com');
    expect(users[0].role).toBe('user');
  });

  test('clearTestData removes all test data', async () => {
    // Insert some test data
    await insertTestUser({ email: 'test1@example.com' });
    await insertTestUser({ email: 'test2@example.com' });
    
    // Verify data was inserted
    let users = await queryDb('SELECT * FROM users');
    expect(users.length).toBeGreaterThanOrEqual(2);
    
    // Clear the data
    await clearTestData();
    
    // Verify data was cleared
    users = await queryDb('SELECT * FROM users');
    expect(users.length).toBe(0);
  });
});
