#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      if (options.showOutput) {
        process.stdout.write(data);
      }
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      if (options.showOutput) {
        process.stderr.write(data);
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject({ stdout, stderr, code });
      }
    });

    child.on('error', (error) => {
      reject({ error: error.message });
    });
  });
}

async function runTestSuite(name, command, args, options = {}) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 Running ${name}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
  
  const startTime = Date.now();
  
  try {
    const result = await runCommand(command, args, { showOutput: true, ...options });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log(`\n✅ ${name} - PASSED (${duration}s)`, 'green');
    return { success: true, duration, result };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log(`\n❌ ${name} - FAILED (${duration}s)`, 'red');
    if (error.stdout) {
      log('STDOUT:', 'yellow');
      console.log(error.stdout);
    }
    if (error.stderr) {
      log('STDERR:', 'yellow');
      console.log(error.stderr);
    }
    
    return { success: false, duration, error };
  }
}

async function checkPrerequisites() {
  log('🔍 Checking prerequisites...', 'blue');
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found. Run this script from the project root.');
  }
  
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    log('📦 Installing dependencies...', 'yellow');
    await runCommand('npm', ['install']);
  }
  
  // Check if test files exist
  const testFiles = [
    'src/server/__tests__/full-system.integration.test.js',
    'src/client/__tests__/e2e/full-workflow.spec.js'
  ];
  
  for (const testFile of testFiles) {
    if (!fs.existsSync(testFile)) {
      log(`⚠️  Test file not found: ${testFile}`, 'yellow');
    }
  }
  
  log('✅ Prerequisites check completed', 'green');
}

async function runComprehensiveTests() {
  const testResults = [];
  const startTime = Date.now();
  
  log('🚀 Starting Comprehensive Application Test Suite', 'magenta');
  log(`📅 Started at: ${new Date().toLocaleString()}`, 'white');
  
  try {
    await checkPrerequisites();
    
    // 1. Backend Unit Tests
    const backendResult = await runTestSuite(
      'Backend Unit Tests',
      'npm',
      ['run', 'test:backend']
    );
    testResults.push({ name: 'Backend Unit Tests', ...backendResult });
    
    // 2. Frontend Component Tests
    const frontendResult = await runTestSuite(
      'Frontend Component Tests',
      'npm',
      ['run', 'test:frontend']
    );
    testResults.push({ name: 'Frontend Component Tests', ...frontendResult });
    
    // 3. Full System Integration Test
    const integrationResult = await runTestSuite(
      'Full System Integration Test',
      'npx',
      ['jest', 'src/server/__tests__/full-system.integration.test.js', '--verbose']
    );
    testResults.push({ name: 'Full System Integration Test', ...integrationResult });
    
    // 4. Episode Management Integration Tests
    const episodeResult = await runTestSuite(
      'Episode Management Tests',
      'npx',
      ['jest', 'src/server/__tests__/episodes.integration.test.js', '--verbose']
    );
    testResults.push({ name: 'Episode Management Tests', ...episodeResult });
    
    // 5. Authentication & Authorization Tests
    const authResult = await runTestSuite(
      'Authentication Tests',
      'npx',
      ['jest', 'src/server/__tests__/auth.integration.test.js', '--verbose']
    );
    testResults.push({ name: 'Authentication Tests', ...authResult });
    
    // 6. User Statistics Tests
    const statsResult = await runTestSuite(
      'User Statistics Tests',
      'npx',
      ['jest', 'src/server/__tests__/user-stats.integration.test.js', '--verbose']
    );
    testResults.push({ name: 'User Statistics Tests', ...statsResult });
    
    // 7. Admin Statistics Tests
    const adminStatsResult = await runTestSuite(
      'Admin Statistics Tests',
      'npx',
      ['jest', 'src/server/__tests__/adminStats.test.js', '--verbose']
    );
    testResults.push({ name: 'Admin Statistics Tests', ...adminStatsResult });
    
    // 8. E2E Tests (if browsers are available)
    try {
      // Check if Playwright is installed and browsers are available
      await runCommand('npx', ['playwright', '--version']);
      
      const e2eResult = await runTestSuite(
        'End-to-End Workflow Tests',
        'npx',
        ['playwright', 'test', 'src/client/__tests__/e2e/full-workflow.spec.js', '--reporter=list']
      );
      testResults.push({ name: 'End-to-End Workflow Tests', ...e2eResult });
      
      // Run existing E2E tests
      const e2eExistingResult = await runTestSuite(
        'Existing E2E Tests',
        'npm',
        ['run', 'test:e2e']
      );
      testResults.push({ name: 'Existing E2E Tests', ...e2eExistingResult });
      
    } catch (error) {
      log('⚠️  Skipping E2E tests - Playwright not available or browsers not installed', 'yellow');
      testResults.push({ 
        name: 'End-to-End Tests', 
        success: false, 
        duration: '0', 
        error: { message: 'Playwright not available' } 
      });
    }
    
  } catch (error) {
    log(`💥 Fatal error during test execution: ${error.message}`, 'red');
    testResults.push({ 
      name: 'Test Suite Execution', 
      success: false, 
      duration: '0', 
      error: { message: error.message } 
    });
  }
  
  // Generate Test Report
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const successCount = testResults.filter(r => r.success).length;
  const failureCount = testResults.filter(r => !r.success).length;
  const totalTests = testResults.length;
  
  log('\n' + '='.repeat(80), 'cyan');
  log('📊 COMPREHENSIVE TEST REPORT', 'cyan');
  log('='.repeat(80), 'cyan');
  
  log(`⏱️  Total Duration: ${totalDuration}s`, 'white');
  log(`✅ Successful: ${successCount}/${totalTests}`, 'green');
  log(`❌ Failed: ${failureCount}/${totalTests}`, 'red');
  log(`📈 Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`, 'white');
  
  log('\n📋 Individual Test Results:', 'white');
  log('-'.repeat(80), 'white');
  
  testResults.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const statusColor = result.success ? 'green' : 'red';
    log(`${index + 1}. ${result.name}: ${status} (${result.duration}s)`, statusColor);
    
    if (!result.success && result.error) {
      log(`   Error: ${result.error.message || 'Unknown error'}`, 'red');
    }
  });
  
  // Performance Summary
  log('\n⚡ Performance Summary:', 'white');
  log('-'.repeat(80), 'white');
  
  const sortedByDuration = [...testResults]
    .filter(r => r.duration)
    .sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration));
  
  sortedByDuration.slice(0, 5).forEach((result, index) => {
    log(`${index + 1}. ${result.name}: ${result.duration}s`, 'yellow');
  });
  
  // Coverage Information (if available)
  log('\n📈 Coverage Information:', 'white');
  log('-'.repeat(80), 'white');
  
  try {
    if (fs.existsSync('coverage')) {
      log('✅ Backend coverage report available in coverage/', 'green');
    }
    if (fs.existsSync('coverage-frontend')) {
      log('✅ Frontend coverage report available in coverage-frontend/', 'green');
    }
    log('💡 Run with --coverage flag for detailed coverage reports', 'blue');
  } catch (error) {
    log('⚠️  Coverage information not available', 'yellow');
  }
  
  // Recommendations
  log('\n💡 Recommendations:', 'white');
  log('-'.repeat(80), 'white');
  
  if (failureCount > 0) {
    log('🔧 Some tests failed. Check individual test output above for details.', 'yellow');
    log('🔍 Consider running failed tests individually for more detailed output.', 'yellow');
  }
  
  if (successCount === totalTests) {
    log('🎉 All tests passed! Your application is ready for production.', 'green');
  } else if (successCount / totalTests >= 0.8) {
    log('✨ Most tests passed. Address failing tests before deployment.', 'yellow');
  } else {
    log('⚠️  Many tests failed. Significant issues need to be addressed.', 'red');
  }
  
  log('\n🚀 Test execution completed!', 'magenta');
  log(`📅 Finished at: ${new Date().toLocaleString()}`, 'white');
  
  // Exit with appropriate code
  process.exit(failureCount === 0 ? 0 : 1);
}

// Additional test utilities
async function runQuickTests() {
  log('⚡ Running Quick Test Suite (essential tests only)', 'cyan');
  
  const quickTests = [
    {
      name: 'Backend Smoke Test',
      command: 'npx',
      args: ['jest', 'src/server/__tests__/simple.test.js']
    },
    {
      name: 'Frontend Smoke Test',
      command: 'npx',
      args: ['jest', '--config', 'jest.frontend.config.js', 'src/client/__tests__/components/StarRating.test.jsx']
    },
    {
      name: 'Integration Smoke Test',
      command: 'npx',
      args: ['jest', 'src/server/__tests__/auth.integration.test.js', '--testNamePattern="should login admin successfully"']
    }
  ];
  
  for (const test of quickTests) {
    await runTestSuite(test.name, test.command, test.args);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isQuickMode = args.includes('--quick') || args.includes('-q');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  log('🧪 Comprehensive Test Runner', 'cyan');
  log('Usage: node run-comprehensive-tests.js [options]', 'white');
  log('', 'white');
  log('Options:', 'white');
  log('  --quick, -q    Run quick test suite only', 'white');
  log('  --help, -h     Show this help message', 'white');
  log('', 'white');
  log('Examples:', 'white');
  log('  node run-comprehensive-tests.js          # Run all tests', 'white');
  log('  node run-comprehensive-tests.js --quick  # Run quick tests only', 'white');
  process.exit(0);
}

// Main execution
if (isQuickMode) {
  runQuickTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
} else {
  runComprehensiveTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}