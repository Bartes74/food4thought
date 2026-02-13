import Sequencer from '@jest/test-sequencer';

export default class CustomSequencer extends Sequencer {
  sort(tests) {
    // Sort tests to run in a logical order for integration testing
    const testOrder = [
      'auth.integration.test.js',        // Authentication first
      'adminStats.test.js',              // Admin functionality
      'episodes.integration.test.js',    // Episode management
      'user-stats.integration.test.js',  // User statistics
      'full-system.integration.test.js'  // Complete system test last
    ];

    return tests.sort((testA, testB) => {
      const aIndex = testOrder.findIndex(test => testA.path.includes(test));
      const bIndex = testOrder.findIndex(test => testB.path.includes(test));
      
      if (aIndex === -1 && bIndex === -1) {
        return testA.path.localeCompare(testB.path);
      }
      
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
  }
}