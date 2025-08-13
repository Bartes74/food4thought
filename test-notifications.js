#!/usr/bin/env node

import fetch from 'node-fetch';
import { execSync } from 'child_process';

const API_BASE = 'http://localhost:3001/api';

// Kolory dla konsoli
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Funkcja do rejestracji admina
async function createAdminUser() {
  try {
    log('🔧 Tworzenie użytkownika admin...', 'blue');
    
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin-notifications@test.com',
        password: 'Admin123!',
        confirmPassword: 'Admin123!'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Użytkownik admin utworzony', 'green');
      
      // Weryfikuj email
      if (data.verificationToken) {
        log('🔗 Weryfikowanie email...', 'blue');
        const verifyResponse = await fetch(`${API_BASE}/auth/verify-email?token=${data.verificationToken}`, {
          method: 'GET'
        });
        
        if (verifyResponse.ok) {
          log('✅ Email zweryfikowany', 'green');
        } else {
          const verifyData = await verifyResponse.json();
          log(`❌ Błąd weryfikacji: ${verifyData.error}`, 'red');
        }
      }
      
      return data.user;
    } else {
      log(`❌ Błąd tworzenia użytkownika: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Błąd: ${error.message}`, 'red');
    return null;
  }
}

// Funkcja do logowania
async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Zalogowano pomyślnie', 'green');
      return data.token;
    } else {
      log(`❌ Błąd logowania: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Błąd: ${error.message}`, 'red');
    return null;
  }
}

// Funkcja do zmiany roli użytkownika na admin
function makeUserAdmin(userId) {
  try {
    log('🔧 Zmiana roli na admin...', 'blue');
    execSync(`sqlite3 data/food4thought.db "UPDATE users SET role = 'admin' WHERE id = ${userId};"`);
    log('✅ Rola zmieniona na admin', 'green');
  } catch (error) {
    log(`❌ Błąd zmiany roli: ${error.message}`, 'red');
  }
}

// Funkcja do tworzenia powiadomienia
async function createNotification(token, title, message) {
  try {
    const response = await fetch(`${API_BASE}/notifications/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, message })
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Powiadomienie utworzone', 'green');
      return data;
    } else {
      log(`❌ Błąd tworzenia powiadomienia: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Błąd: ${error.message}`, 'red');
    return null;
  }
}

// Funkcja do pobierania powiadomień admina
async function getAdminNotifications(token) {
  try {
    const response = await fetch(`${API_BASE}/notifications/admin`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Pobrano powiadomienia admina', 'green');
      return data;
    } else {
      log(`❌ Błąd pobierania powiadomień: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Błąd: ${error.message}`, 'red');
    return null;
  }
}

// Funkcja do pobierania powiadomień użytkownika
async function getUserNotifications(token) {
  try {
    const response = await fetch(`${API_BASE}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Pobrano powiadomienia użytkownika', 'green');
      return data;
    } else {
      log(`❌ Błąd pobierania powiadomień: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Błąd: ${error.message}`, 'red');
    return null;
  }
}

// Funkcja do rejestrowania wyświetlenia
async function viewNotification(token, notificationId) {
  try {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Wyświetlenie zarejestrowane', 'green');
      return data;
    } else {
      log(`❌ Błąd rejestrowania wyświetlenia: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Błąd: ${error.message}`, 'red');
    return null;
  }
}

// Funkcja do odrzucania powiadomienia
async function dismissNotification(token, notificationId) {
  try {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/dismiss`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Powiadomienie odrzucone', 'green');
      return data;
    } else {
      log(`❌ Błąd odrzucania powiadomienia: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Błąd: ${error.message}`, 'red');
    return null;
  }
}

// Funkcja do pobierania statystyk powiadomienia
async function getNotificationStats(token, notificationId) {
  try {
    const response = await fetch(`${API_BASE}/notifications/admin/${notificationId}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Pobrano statystyki powiadomienia', 'green');
      return data;
    } else {
      log(`❌ Błąd pobierania statystyk: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Błąd: ${error.message}`, 'red');
    return null;
  }
}

// Funkcja do czyszczenia danych testowych
function cleanupTestData() {
  try {
    log('🧹 Czyszczenie danych testowych...', 'yellow');
    execSync(`sqlite3 data/food4thought.db "DELETE FROM notification_stats WHERE notification_id IN (SELECT id FROM admin_notifications WHERE created_by IN (SELECT id FROM users WHERE email LIKE '%test.com'));"`);
    execSync(`sqlite3 data/food4thought.db "DELETE FROM admin_notifications WHERE created_by IN (SELECT id FROM users WHERE email LIKE '%test.com');"`);
    execSync(`sqlite3 data/food4thought.db "DELETE FROM users WHERE email LIKE '%test.com';"`);
    log('✅ Dane testowe wyczyszczone', 'green');
  } catch (error) {
    log(`❌ Błąd czyszczenia: ${error.message}`, 'red');
  }
}

// Główna funkcja testowa
async function runTests() {
  log('\n🚀 Rozpoczynam testy systemu powiadomień...', 'bold');
  
  // Czyszczenie przed testami
  cleanupTestData();
  
  // 1. Tworzenie użytkownika admin
  const adminUser = await createAdminUser();
  if (!adminUser) {
    log('❌ Nie można utworzyć użytkownika admin', 'red');
    return;
  }
  
  // 2. Zmiana roli na admin
  makeUserAdmin(adminUser.id);
  
  // 3. Logowanie admina
  const adminToken = await loginUser('admin-notifications@test.com', 'Admin123!');
  if (!adminToken) {
    log('❌ Nie można zalogować admina', 'red');
    return;
  }
  
  // 4. Tworzenie powiadomienia
  const notification = await createNotification(
    adminToken,
    'Testowe powiadomienie',
    'To jest testowe powiadomienie od administratora. Sprawdź czy działa poprawnie!'
  );
  
  if (!notification) {
    log('❌ Nie można utworzyć powiadomienia', 'red');
    return;
  }
  
  // 5. Pobieranie powiadomień admina
  const adminNotifications = await getAdminNotifications(adminToken);
  if (!adminNotifications) {
    log('❌ Nie można pobrać powiadomień admina', 'red');
    return;
  }
  
  log(`📊 Znaleziono ${adminNotifications.length} powiadomień`, 'blue');
  
  // 6. Tworzenie użytkownika testowego
  log('\n👤 Tworzenie użytkownika testowego...', 'blue');
  const testUserResponse = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test-user-notifications@test.com',
      password: 'Test123!',
      confirmPassword: 'Test123!'
    })
  });
  
  const testUserData = await testUserResponse.json();
  if (testUserResponse.ok && testUserData.verificationToken) {
    // Weryfikuj email
    log('🔗 Weryfikowanie email użytkownika testowego...', 'blue');
    const verifyResponse = await fetch(`${API_BASE}/auth/verify-email?token=${testUserData.verificationToken}`, {
      method: 'GET'
    });
    
    if (verifyResponse.ok) {
      log('✅ Email użytkownika testowego zweryfikowany', 'green');
    } else {
      const verifyData = await verifyResponse.json();
      log(`❌ Błąd weryfikacji użytkownika testowego: ${verifyData.error}`, 'red');
    }
  }
  
  // 7. Logowanie użytkownika testowego
  const userToken = await loginUser('test-user-notifications@test.com', 'Test123!');
  if (!userToken) {
    log('❌ Nie można zalogować użytkownika testowego', 'red');
    return;
  }
  
  // 8. Pobieranie powiadomień użytkownika
  const userNotifications = await getUserNotifications(userToken);
  if (!userNotifications) {
    log('❌ Nie można pobrać powiadomień użytkownika', 'red');
    return;
  }
  
  log(`📱 Użytkownik ma ${userNotifications.length} powiadomień`, 'blue');
  
  // 9. Rejestrowanie wyświetlenia
  if (userNotifications.length > 0) {
    await viewNotification(userToken, userNotifications[0].id);
  }
  
  // 10. Odrzucanie powiadomienia
  if (userNotifications.length > 0) {
    await dismissNotification(userToken, userNotifications[0].id);
  }
  
  // 11. Pobieranie statystyk
  if (notification.id) {
    const stats = await getNotificationStats(adminToken, notification.id);
    if (stats) {
      log('\n📈 Statystyki powiadomienia:', 'blue');
      log(`   Użytkowników: ${stats.summary.total_users}`, 'green');
      log(`   Wyświetleń: ${stats.summary.total_views}`, 'green');
      log(`   Odrzuconych: ${stats.summary.dismissed_count}`, 'green');
      log(`   Aktywnych: ${stats.summary.active_users}`, 'green');
      log(`   Średnio wyświetleń: ${stats.summary.average_views}`, 'green');
    }
  }
  
  // 12. Sprawdzenie czy powiadomienie zostało odrzucone
  const updatedUserNotifications = await getUserNotifications(userToken);
  log(`📱 Po odrzuceniu: ${updatedUserNotifications.length} powiadomień`, 'blue');
  
  // Czyszczenie po testach
  cleanupTestData();
  
  log('\n🎉 Testy systemu powiadomień zakończone pomyślnie!', 'bold');
}

// Uruchom testy
runTests().catch(error => {
  log(`❌ Błąd podczas testów: ${error.message}`, 'red');
  process.exit(1);
});
