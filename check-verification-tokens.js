#!/usr/bin/env node

import { execSync } from 'child_process';

const FRONTEND_BASE = 'http://localhost:3000';

function checkVerificationTokens() {
  console.log('🔍 Sprawdzanie aktywnych tokenów weryfikacyjnych');
  console.log('=====================================\n');

  try {
    // Pobierz wszystkie aktywne tokeny
    const query = `
      SELECT 
        ev.user_id,
        u.email,
        ev.token,
        ev.created_at,
        ev.expires_at,
        ev.used
      FROM email_verifications ev
      JOIN users u ON ev.user_id = u.id
      WHERE ev.expires_at > datetime('now')
      ORDER BY ev.created_at DESC
    `;
    
    const result = execSync(`sqlite3 data/food4thought.db "${query}"`, { encoding: 'utf8' });
    
    if (!result.trim()) {
      console.log('📭 Brak aktywnych tokenów weryfikacyjnych');
      return;
    }
    
    const tokens = result.trim().split('\n').map(line => {
      const [userId, email, token, createdAt, expiresAt, used] = line.split('|');
      return { userId, email, token, createdAt, expiresAt, used: used === '1' };
    });
    
    console.log(`📊 Znaleziono ${tokens.length} aktywnych tokenów:\n`);
    
    tokens.forEach((token, index) => {
      const verificationUrl = `${FRONTEND_BASE}/verify-email?token=${token.token}`;
      const status = token.used === '1' ? '❌ Użyty' : '✅ Aktywny';
      
      console.log(`${index + 1}. ${token.email} (ID: ${token.userId})`);
      console.log(`   Status: ${status}`);
      console.log(`   Utworzony: ${token.createdAt}`);
      console.log(`   Wygasa: ${token.expiresAt}`);
      console.log(`   Link: ${verificationUrl}`);
      console.log('');
    });
    
    // Pokaż nieużyte tokeny
    const unusedTokens = tokens.filter(t => t.used !== '1');
    if (unusedTokens.length > 0) {
      console.log('🎯 NIEWYKORZYSTANE TOKENY:');
      console.log('=====================================');
      unusedTokens.forEach((token, index) => {
        const verificationUrl = `${FRONTEND_BASE}/verify-email?token=${token.token}`;
        console.log(`${index + 1}. ${token.email}`);
        console.log(`   ${verificationUrl}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
}

// Sprawdź czy baza danych istnieje
function checkDatabase() {
  try {
    execSync('ls data/food4thought.db', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.log('❌ Baza danych nie istnieje');
    console.log('   Uruchom serwer: npm start');
    return false;
  }
}

// Główna funkcja
function main() {
  const dbExists = checkDatabase();
  if (!dbExists) {
    process.exit(1);
  }
  
  checkVerificationTokens();
}

main();
