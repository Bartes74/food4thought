#!/usr/bin/env node

import fetch from 'node-fetch';
import readline from 'readline';

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testRegistration() {
  console.log('🎯 Test Rejestracji Food 4 Thought');
  console.log('=====================================\n');

  try {
    // Pobierz dane od użytkownika
    const email = await question('📧 Email: ');
    const password = await question('🔒 Hasło: ');
    const confirmPassword = await question('🔒 Potwierdź hasło: ');

    if (password !== confirmPassword) {
      console.log('❌ Hasła nie są identyczne!');
      return;
    }

    console.log('\n🔄 Rejestruję użytkownika...');

    // Rejestracja
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        confirmPassword
      })
    });

    const registerData = await registerResponse.json();

    if (!registerResponse.ok) {
      console.log('❌ Błąd rejestracji:', registerData.message || registerData.error);
      return;
    }

    console.log('✅ Rejestracja udana!');
    console.log('👤 Użytkownik ID:', registerData.user.id);
    console.log('📧 Email:', registerData.user.email);

    // Pobierz token z bazy danych
    console.log('\n🔍 Pobieram link aktywacyjny...');
    
    const { execSync } = await import('child_process');
    const tokenResult = execSync(`sqlite3 data/food4thought.db "SELECT token FROM email_verifications WHERE user_id = ${registerData.user.id} ORDER BY created_at DESC LIMIT 1;"`, { encoding: 'utf8' });
    
    if (tokenResult.trim()) {
      const verificationUrl = `${FRONTEND_BASE}/verify-email?token=${tokenResult.trim()}`;
      
      console.log('\n🎉 LINK AKTYWACYJNY:');
      console.log('=====================================');
      console.log(verificationUrl);
      console.log('=====================================');
      
      // Automatyczna weryfikacja
      console.log('\n🔄 Automatycznie weryfikuję email...');
      
      const verifyResponse = await fetch(`${API_BASE}/auth/verify-email?token=${tokenResult.trim()}`);
      const verifyData = await verifyResponse.json();
      
      if (verifyResponse.ok) {
        console.log('✅ Email zweryfikowany!');
        console.log('📝 Wiadomość:', verifyData.message);
        
        // Test logowania
        console.log('\n🔄 Testuję logowanie...');
        
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
          console.log('🎫 Token JWT otrzymany');
          console.log('👤 Użytkownik zweryfikowany:', loginData.user.email_verified ? 'Tak' : 'Nie');
        } else {
          console.log('❌ Błąd logowania:', loginData.message || loginData.error);
        }
      } else {
        console.log('❌ Błąd weryfikacji:', verifyData.message || verifyData.error);
      }
    } else {
      console.log('❌ Nie znaleziono tokenu weryfikacyjnego');
    }

  } catch (error) {
    console.error('❌ Błąd:', error.message);
  } finally {
    rl.close();
  }
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
  
  await testRegistration();
}

main();
