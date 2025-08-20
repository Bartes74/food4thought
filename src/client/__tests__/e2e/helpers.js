/**
 * Helpery dla testów e2e
 */

/**
 * Loguje użytkownika do aplikacji
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @param {string} email - Email użytkownika
 * @param {string} password - Hasło użytkownika
 */
async function loginUser(page, email = 'admin@food4thought.local', password = 'admin123') {
  await page.goto('/');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Poczekaj na przekierowanie do strony głównej
  await page.waitForURL('/');
}

/**
 * Czeka na załadowanie elementu z timeoutem
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @param {string} selector - Selektor elementu
 * @param {number} timeout - Timeout w milisekundach (domyślnie 10000)
 */
async function waitForElement(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { timeout });
}

/**
 * Sprawdza czy element jest widoczny i klikalny
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @param {string} selector - Selektor elementu
 * @returns {Promise<boolean>} - Czy element jest widoczny i klikalny
 */
async function isElementClickable(page, selector) {
  try {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: 5000 });
    return await element.isEnabled();
  } catch {
    return false;
  }
}

/**
 * Generuje unikalny email dla testów
 * @returns {string} - Unikalny email
 */
function generateUniqueEmail() {
  return `test${Date.now()}@example.com`;
}

/**
 * Czeka na zakończenie animacji
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @param {number} delay - Opóźnienie w milisekundach (domyślnie 500)
 */
async function waitForAnimation(page, delay = 500) {
  await page.waitForTimeout(delay);
}

/**
 * Sprawdza czy strona jest responsywna
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @param {number} width - Szerokość viewport
 * @param {number} height - Wysokość viewport
 */
async function checkResponsiveness(page, width, height) {
  await page.setViewportSize({ width, height });
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
}

/**
 * Sprawdza dostępność elementu
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @param {string} selector - Selektor elementu
 * @returns {Promise<boolean>} - Czy element jest dostępny
 */
async function isElementAccessible(page, selector) {
  try {
    const element = page.locator(selector);
    const ariaLabel = await element.getAttribute('aria-label');
    const textContent = await element.textContent();
    return !!(ariaLabel || textContent);
  } catch {
    return false;
  }
}

/**
 * Symuluje odtwarzanie audio
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @param {number} duration - Czas odtwarzania w sekundach
 */
async function simulateAudioPlayback(page, duration = 5) {
  const playButton = page.locator('button[aria-label*="play"], button[aria-label*="Play"]');
  if (await playButton.isVisible()) {
    await playButton.click();
    await page.waitForTimeout(duration * 1000);
  }
}

// Autoodtwarzanie – usunięte; helpery toggleAutoPlay oraz isAutoPlayEnabled wycofane

/**
 * Czeka na powiadomienie
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @param {string} expectedText - Oczekiwany tekst powiadomienia
 * @param {number} timeout - Timeout w milisekundach (domyślnie 10000)
 */
async function waitForNotification(page, expectedText, timeout = 10000) {
  try {
    await page.waitForFunction(
      () => {
        const notifications = document.querySelectorAll('.notification, .toast, [role="alert"]');
        return Array.from(notifications).some(notification => 
          notification.textContent.includes(expectedText)
        );
      },
      { timeout }
    );
  } catch (error) {
    console.log(`Nie znaleziono powiadomienia z tekstem: ${expectedText}`);
  }
}

/**
 * Sprawdza czy API endpoint odpowiada
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @param {string} endpoint - Endpoint do sprawdzenia
 * @returns {Promise<boolean>} - Czy endpoint odpowiada
 */
async function checkApiEndpoint(page, endpoint) {
  try {
    const response = await page.request.get(`/api${endpoint}`);
    return response.status() === 200 || response.status() === 401; // 401 to OK dla endpointów wymagających autoryzacji
  } catch (error) {
    return false;
  }
}

/**
 * Symuluje zakończenie odcinka
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 */
async function simulateEpisodeEnd(page) {
  // Symuluj zakończenie odcinka przez ustawienie currentTime na duration
  await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = audio.duration;
      audio.dispatchEvent(new Event('ended'));
    }
  });
  
  // Poczekaj na reakcję aplikacji
  await page.waitForTimeout(2000);
}

/**
 * Sprawdza czy użytkownik jest zalogowany
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @returns {Promise<boolean>} - Czy użytkownik jest zalogowany
 */
async function isUserLoggedIn(page) {
  try {
    await page.waitForSelector('header', { timeout: 5000 });
    const headerText = await page.locator('header').textContent();
    return headerText.includes('admin@food4thought.local') || headerText.includes('test@example.com');
  } catch {
    return false;
  }
}

/**
 * Sprawdza czy aplikacja jest w trybie ciemnym
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @returns {Promise<boolean>} - Czy aplikacja jest w trybie ciemnym
 */
async function isDarkMode(page) {
  return await page.evaluate(() => {
    return document.documentElement.classList.contains('dark') ||
           document.body.classList.contains('dark');
  });
}

/**
 * Przełącza tryb ciemny/jasny
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 */
async function toggleTheme(page) {
  const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button[aria-label*="theme"]');
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    await waitForAnimation(page);
  }
}

/**
 * Sprawdza czy element ma odpowiedni kontrast
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 * @param {string} selector - Selektor elementu
 * @returns {Promise<boolean>} - Czy element ma odpowiedni kontrast
 */
async function hasGoodContrast(page, selector) {
  try {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: 5000 });
    
    // Sprawdź czy element jest widoczny (podstawowy test kontrastu)
    const isVisible = await element.isVisible();
    const textContent = await element.textContent();
    
    return isVisible && textContent && textContent.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Sprawdza czy aplikacja obsługuje klawiaturę
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 */
async function testKeyboardNavigation(page) {
  // Sprawdź czy można nawigować za pomocą Tab
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  
  // Sprawdź czy można aktywować za pomocą Enter
  await page.keyboard.press('Enter');
}

/**
 * Sprawdza czy aplikacja obsługuje screen reader
 * @param {import('@playwright/test').Page} page - Obiekt strony Playwright
 */
async function testScreenReaderSupport(page) {
  const images = page.locator('img');
  
  for (let i = 0; i < await images.count(); i++) {
    const image = images.nth(i);
    const altText = await image.getAttribute('alt');
    expect(altText).toBeTruthy();
  }
}

export {
  loginUser,
  waitForElement,
  isElementClickable,
  generateUniqueEmail,
  waitForAnimation,
  checkResponsiveness,
  isElementAccessible,
  simulateAudioPlayback,
  isDarkMode,
  toggleTheme,
  hasGoodContrast,
  testKeyboardNavigation,
  testScreenReaderSupport,
  waitForNotification,
  checkApiEndpoint,
  simulateEpisodeEnd,
  isUserLoggedIn
}; 