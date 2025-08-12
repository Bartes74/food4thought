#!/usr/bin/env node

import fetch from 'node-fetch';
import { execSync } from 'child_process';

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:3000';

// Generuj losowy email
function generateTestEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test${timestamp}${random}@dajer.pl`;
}

// Generuj losowe hasło
function generatePassword() {
  return `TestPassword${Math.floor(Math.random() * 1000)}!`;
}

async function testBatchRegistration(count = 1) {
  console.log(`🎯 Test Rejestracji Batch - ${count} użytkowników`);
  console.log('=====================================\n');

  const results = [];

  for (let i = 0; i < count; i++) {
    console.log(`\n🔄 Test ${i + 1}/${count}`);
    
    const email = generateTestEmail();
    const password = generatePassword();
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔒 Hasło: ${password}`);

    try {
      // Rejestracja
      const registerResponse = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword: password
        })
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        console.log('❌ Błąd rejestracji:', registerData.message || registerData.error);
        results.push({ email, success: false, error: registerData.message });
        continue;
      }

      console.log('✅ Rejestracja udana!');
      console.log('👤 Użytkownik ID:', registerData.user.id);

      // Pobierz token z bazy danych
      const tokenResult = execSync(`sqlite3 data/food4thought.db "SELECT token FROM email_verifications WHERE user_id = ${registerData.user.id} ORDER BY created_at DESC LIMIT 1;"`, { encoding: 'utf8' });
      
      if (tokenResult.trim()) {
        const verificationUrl = `${FRONTEND_BASE}/verify-email?token=${tokenResult.trim()}`;
        
        console.log('🎉 LINK AKTYWACYJNY:');
        console.log(verificationUrl);
        
        // Automatyczna weryfikacja
        const verifyResponse = await fetch(`${API_BASE}/auth/verify-email?token=${tokenResult.trim()}`);
        const verifyData = await verifyResponse.json();
        
        if (verifyResponse.ok) {
          console.log('✅ Email zweryfikowany!');
          
          // Test logowania
          const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password
            })
          });
          
          const loginData = await loginResponse.json();
          
          if (loginResponse.ok) {
            console.log('✅ Logowanie udane!');
            results.push({ 
              email, 
              password, 
              userId: registerData.user.id, 
              success: true, 
              verificationUrl,
              token: loginData.token 
            });
          } else {
            console.log('❌ Błąd logowania:', loginData.message);
            results.push({ email, success: false, error: 'Login failed' });
          }
        } else {
          console.log('❌ Błąd weryfikacji:', verifyData.message);
          results.push({ email, success: false, error: 'Verification failed' });
        }
      } else {
        console.log('❌ Nie znaleziono tokenu weryfikacyjnego');
        results.push({ email, success: false, error: 'No verification token' });
      }

    } catch (error) {
      console.error('❌ Błąd:', error.message);
      results.push({ email, success: false, error: error.message });
    }
  }

  // Podsumowanie
  console.log('\n📊 PODSUMOWANIE TESTÓW');
  console.log('=====================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Udane: ${successful.length}/${results.length}`);
  console.log(`❌ Nieudane: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 UDANE REJESTRACJE:');
    successful.forEach((result, index) => {
      console.log(`${index + 1}. ${result.email} (ID: ${result.userId})`);
      console.log(`   Hasło: ${result.password}`);
      console.log(`   Link: ${result.verificationUrl}`);
      console.log('');
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ NIEPOWODZENIA:');
    failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.email} - ${result.error}`);
    });
  }

  return results;
}

// Sprawdź czy serwer działa
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      console.log('✅ Serwer działa na http://localhost:3001');
      return true;
    }
  } catch (error) {
    console.log('❌ Serwer nie odpowiada na http://localhost:3001');
    console.log('   Uruchom serwer: npm start');
    return false;
  }
}

// Główna funkcja
async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  const count = parseInt(process.argv[2]) || 1;
  await testBatchRegistration(count);
}

main();
