import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analizuje wydajność testów E2E na podstawie raportów Playwright
 */
function analyzeTestPerformance() {
  const resultsPath = path.join(__dirname, '../../../test-results/results.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.log('❌ Brak pliku z wynikami testów. Uruchom testy najpierw.');
    return;
  }
  
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  
  console.log('📊 ANALIZA WYDAJNOŚCI TESTÓW E2E\n');
  
  const testStats = {
    total: 0,
    passed: 0,
    failed: 0,
    totalTime: 0,
    slowTests: [],
    fastTests: []
  };
  
  results.suites.forEach(suite => {
    suite.specs.forEach(spec => {
      spec.tests.forEach(test => {
        testStats.total++;
        
        if (test.results[0].status === 'passed') {
          testStats.passed++;
        } else {
          testStats.failed++;
        }
        
        const duration = test.results[0].duration;
        testStats.totalTime += duration;
        
        const testInfo = {
          name: `${spec.title} › ${test.title}`,
          duration: duration,
          status: test.results[0].status
        };
        
        if (duration > 10000) { // > 10s
          testStats.slowTests.push(testInfo);
        } else if (duration < 2000) { // < 2s
          testStats.fastTests.push(testInfo);
        }
      });
    });
  });
  
  // Sortuj testy według czasu
  testStats.slowTests.sort((a, b) => b.duration - a.duration);
  testStats.fastTests.sort((a, b) => a.duration - b.duration);
  
  console.log(`📈 OGÓLNE STATYSTYKI:`);
  console.log(`   Łącznie testów: ${testStats.total}`);
  console.log(`   Przeszło: ${testStats.passed} ✅`);
  console.log(`   Nie przeszło: ${testStats.failed} ❌`);
  console.log(`   Całkowity czas: ${(testStats.totalTime / 1000).toFixed(1)}s`);
  console.log(`   Średni czas: ${(testStats.totalTime / testStats.total / 1000).toFixed(1)}s`);
  
  console.log(`\n🐌 NAJWOLNIEJSZE TESTY (${testStats.slowTests.length}):`);
  testStats.slowTests.slice(0, 10).forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.name} - ${(test.duration / 1000).toFixed(1)}s ${test.status === 'passed' ? '✅' : '❌'}`);
  });
  
  console.log(`\n⚡ NAJSZYBSZE TESTY (${testStats.fastTests.length}):`);
  testStats.fastTests.slice(0, 10).forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.name} - ${(test.duration / 1000).toFixed(1)}s ${test.status === 'passed' ? '✅' : '❌'}`);
  });
  
  // Rekomendacje
  console.log(`\n💡 REKOMENDACJE:`);
  if (testStats.slowTests.length > 0) {
    console.log(`   • ${testStats.slowTests.length} testów trwa dłużej niż 10s - rozważ optymalizację`);
  }
  if (testStats.totalTime > 180000) { // > 3 min
    console.log(`   • Całkowity czas testów (${(testStats.totalTime / 1000 / 60).toFixed(1)}min) jest długi - rozważ parallel execution`);
  }
  if (testStats.failed > 0) {
    console.log(`   • ${testStats.failed} testów nie przeszło - napraw przed optymalizacją`);
  }
  
  console.log(`\n🎯 CEL: < 1min dla wszystkich testów`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeTestPerformance();
}

export { analyzeTestPerformance }; 