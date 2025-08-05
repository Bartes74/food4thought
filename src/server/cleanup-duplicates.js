import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { verbose } = sqlite3;
const SQLite3 = verbose();

// Ścieżka do pliku bazy danych
const dbPath = path.join(__dirname, '../food4thought.db');

// Połączenie z bazą
const db = new SQLite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Błąd połączenia z bazą danych:', err);
    process.exit(1);
  } else {
    console.log('✅ Połączono z bazą danych');
  }
});

console.log('🧹 Rozpoczynam czyszczenie duplikatów serii...');

db.serialize(() => {
  // Najpierw pokaż duplikaty
  db.all(`
    SELECT name, COUNT(*) as count 
    FROM series 
    GROUP BY name 
    HAVING COUNT(*) > 1
  `, (err, duplicates) => {
    if (err) {
      console.error('❌ Błąd sprawdzania duplikatów:', err);
      return;
    }
    
    if (duplicates.length === 0) {
      console.log('✅ Brak duplikatów serii');
      db.close();
      return;
    }
    
    console.log(`⚠️  Znaleziono duplikaty dla: ${duplicates.map(d => d.name).join(', ')}`);
    
    // Usuń duplikaty - zostaw tylko pierwsze wystąpienie każdej nazwy
    db.run(`
      DELETE FROM series 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM series 
        GROUP BY name
      )
    `, function(err) {
      if (err) {
        console.error('❌ Błąd usuwania duplikatów:', err);
      } else {
        console.log(`✅ Usunięto ${this.changes} duplikatów`);
      }
      
      // Pokaż końcowy stan
      db.all(`SELECT id, name, episode_count FROM series ORDER BY name`, (err, series) => {
        if (!err) {
          console.log('\n📋 Aktualne serie:');
          series.forEach(s => {
            console.log(`   - ${s.name} (ID: ${s.id})`);
          });
        }
        
        db.close();
      });
    });
  });
});