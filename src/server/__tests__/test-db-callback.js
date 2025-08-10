// Minimal test for callback-based database connection
import sqlite3 from 'sqlite3';

describe('Database Callback Test', () => {
  test('should connect to in-memory database', (done) => {
    const db = new sqlite3.Database(':memory:', (err) => {
      expect(err).toBeNull();
      
      // Test a simple query
      getDb().get('SELECT 1 as test', (err, row) => {
        expect(err).toBeNull();
        expect(row.test).toBe(1);
        
        // Close the database
        getDb().close((err) => {
          expect(err).toBeNull();
          done();
        });
      });
    });
  });
});
