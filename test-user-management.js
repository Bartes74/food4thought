#!/usr/bin/env node

import fetch from 'node-fetch';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3001/api';
const TEST_USERS = [
  { email: 'test-user@example.com', password: 'TestPassword123!', role: 'user' },
  { email: 'test-admin@example.com', password: 'TestPassword123!', role: 'admin' },
  { email: 'test-super-admin@example.com', password: 'TestPassword123!', role: 'super_admin' }
];

let adminToken = null;
let createdUserIds = [];

// Funkcja do logowania administratora
async function loginAdmin() {
  try {
    console.log('🔐 Logowanie administratora...');
    
    // Najpierw znajdź administratora w bazie
    const adminUser = execSync('sqlite3 data/food4thought.db "SELECT id, email FROM users WHERE role = \'admin\' OR role = \'super_admin\' LIMIT 1;"', { encoding: 'utf8' }).trim();
    
    if (!adminUser) {
      console.log('❌ Nie znaleziono administratora w bazie danych');
      return false;
    }
    
    const [adminId, adminEmail] = adminUser.split('|');
    console.log(`📧 Znaleziono administratora: ${adminEmail} (ID: ${adminId})`);
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'admin123' // Zakładamy standardowe hasło
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      adminToken = data.token;
      console.log('✅ Zalogowano jako administrator');
      return true;
    } else {
      console.log('❌ Błąd logowania administratora');
      return false;
    }
  } catch (error) {
    console.error('❌ Błąd podczas logowania administratora:', error.message);
    return false;
  }
}

// Funkcja do tworzenia użytkownika
async function createUser(userData) {
  try {
    console.log(`👤 Tworzenie użytkownika: ${userData.email} (${userData.role})`);
    
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.password
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const userId = data.user.id;
      createdUserIds.push(userId);
      
      // Jeśli to admin lub super_admin, zaktualizuj rolę
      if (userData.role !== 'user') {
        execSync(`sqlite3 data/food4thought.db "UPDATE users SET role = '${userData.role}' WHERE id = ${userId};"`);
        console.log(`✅ Zaktualizowano rolę na: ${userData.role}`);
      }
      
      console.log(`✅ Utworzono użytkownika: ${userData.email} (ID: ${userId})`);
      return userId;
    } else {
      const error = await response.json();
      console.log(`❌ Błąd tworzenia użytkownika ${userData.email}:`, error.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Błąd podczas tworzenia użytkownika ${userData.email}:`, error.message);
    return null;
  }
}

// Funkcja do dodawania danych testowych dla użytkownika
async function addTestData(userId) {
  try {
    console.log(`📊 Dodawanie danych testowych dla użytkownika ${userId}...`);
    
    // Dodaj dane do różnych tabel
    execSync(`sqlite3 data/food4thought.db "INSERT INTO user_progress (user_id, episode_id, position, completed) VALUES (${userId}, 1, 300, 1);"`);
    execSync(`sqlite3 data/food4thought.db "INSERT INTO user_favorites (user_id, episode_id) VALUES (${userId}, 1);"`);
    execSync(`sqlite3 data/food4thought.db "INSERT INTO ratings (user_id, episode_id, rating) VALUES (${userId}, 1, 5);"`);
    execSync(`sqlite3 data/food4thought.db "INSERT INTO user_stats (user_id, total_listening_time, total_episodes_completed, current_streak) VALUES (${userId}, 3600, 5, 3);"`);
    
    console.log(`✅ Dodano dane testowe dla użytkownika ${userId}`);
  } catch (error) {
    console.error(`❌ Błąd podczas dodawania danych testowych:`, error.message);
  }
}

// Funkcja do usuwania użytkownika przez API
async function deleteUser(userId) {
  try {
    console.log(`🗑️ Usuwanie użytkownika ${userId} przez API...`);
    
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log(`✅ Użytkownik ${userId} usunięty przez API`);
      return true;
    } else {
      const error = await response.json();
      console.log(`❌ Błąd usuwania użytkownika ${userId} przez API:`, error.error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Błąd podczas usuwania użytkownika ${userId}:`, error.message);
    return false;
  }
}

// Funkcja do czyszczenia użytkowników przez SQL
async function cleanupUsers() {
  try {
    console.log('🧹 Czyszczenie użytkowników testowych przez SQL...');
    
    const deleteQuery = `
      DELETE FROM user_progress WHERE user_id IN (${createdUserIds.join(',')});
      DELETE FROM user_favorites WHERE user_id IN (${createdUserIds.join(',')});
      DELETE FROM ratings WHERE user_id IN (${createdUserIds.join(',')});
      DELETE FROM comments WHERE user_id IN (${createdUserIds.join(',')});
      DELETE FROM user_achievements WHERE user_id IN (${createdUserIds.join(',')});
      DELETE FROM user_stats WHERE user_id IN (${createdUserIds.join(',')});
      DELETE FROM listening_sessions WHERE user_id IN (${createdUserIds.join(',')});
      DELETE FROM password_resets WHERE user_id IN (${createdUserIds.join(',')});
      DELETE FROM users WHERE id IN (${createdUserIds.join(',')});
    `;
    
    execSync(`sqlite3 data/food4thought.db "${deleteQuery}"`);
    console.log('✅ Wyczyszczono użytkowników testowych');
  } catch (error) {
    console.error('❌ Błąd podczas czyszczenia:', error.message);
  }
}

// Główna funkcja testowa
async function runTests() {
  console.log('🚀 Rozpoczynam testy zarządzania użytkownikami...\n');
  
  try {
    // 1. Zaloguj się jako administrator
    if (!await loginAdmin()) {
      console.log('❌ Nie można kontynuować bez logowania administratora');
      return;
    }
    
    // 2. Utwórz użytkowników testowych
    console.log('\n📝 Tworzenie użytkowników testowych...');
    for (const userData of TEST_USERS) {
      const userId = await createUser(userData);
      if (userId) {
        await addTestData(userId);
      }
    }
    
    // 3. Przetestuj usuwanie użytkowników przez API
    console.log('\n🧪 Testowanie usuwania użytkowników przez API...');
    for (const userId of [...createdUserIds]) {
      const success = await deleteUser(userId);
      if (success) {
        createdUserIds = createdUserIds.filter(id => id !== userId);
      }
    }
    
    // 4. Sprawdź czy pozostali użytkownicy nadal istnieją
    if (createdUserIds.length > 0) {
      console.log('\n⚠️ Niektórzy użytkownicy nie zostali usunięci przez API:');
      for (const userId of createdUserIds) {
        const user = execSync(`sqlite3 data/food4thought.db "SELECT email, role FROM users WHERE id = ${userId};"`, { encoding: 'utf8' }).trim();
        console.log(`   - ID ${userId}: ${user}`);
      }
    }
    
    console.log('\n✅ Testy zakończone!');
    
  } catch (error) {
    console.error('❌ Błąd podczas testów:', error.message);
  } finally {
    // 5. Wyczyść pozostałych użytkowników testowych
    if (createdUserIds.length > 0) {
      console.log('\n🧹 Czyszczenie pozostałych użytkowników testowych...');
      await cleanupUsers();
    }
  }
}

// Uruchom testy
runTests().catch(console.error);
