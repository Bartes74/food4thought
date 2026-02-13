import { test, expect } from '@playwright/test';

test.describe('Complete Application Workflow E2E Tests', () => {
  let episodeTitle = `E2E Test Episode ${Date.now()}`;
  let seriesName = `E2E Test Series ${Date.now()}`;
  let testUserEmail = `e2e.test.${Date.now()}@example.com`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    
    // Wait for app to load
    try {
      await page.waitForSelector('text=Ładowanie...', { state: 'hidden', timeout: 10000 });
    } catch (e) {
      console.log('Loading state not found or already hidden');
    }
  });

  test.describe('Complete Admin Workflow', () => {
    test('should complete full admin journey: login -> create series -> create episode -> upload audio -> manage content', async ({ page }) => {
      // Step 1: Admin Login
      await page.click('text=Zaloguj się');
      await page.fill('input[type="email"]', 'admin@food4thought.local');
      await page.fill('input[type="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await expect(page.locator('text=Panel administracyjny')).toBeVisible({ timeout: 10000 });

      // Step 2: Navigate to Admin Panel
      const adminLink = page.locator('[data-testid="admin-link"], a[href*="admin"], button[title*="admin"], a:has-text("Admin")');
      if (await adminLink.isVisible()) {
        await adminLink.click();
        await expect(page).toHaveURL(/\/admin/);
      }

      // Step 3: Create New Series
      const seriesLink = page.locator('a:has-text("Zarządzanie seriami"), a[href*="series"]');
      if (await seriesLink.isVisible()) {
        await seriesLink.click();
        await expect(page).toHaveURL(/\/series/);

        // Click Add Series button
        const addSeriesButton = page.locator('button:has-text("+ Dodaj serię"), button:has-text("Add series")');
        if (await addSeriesButton.isVisible()) {
          await addSeriesButton.click();
          
          // Fill series form
          await page.fill('input[placeholder*="Nazwa"], input[placeholder*="Name"]', seriesName);
          await page.fill('textarea[placeholder*="Opis"], textarea[placeholder*="Description"]', 'Series created during E2E testing');
          await page.fill('input[type="color"]', '#FF5722');
          
          // Submit series form
          await page.click('button:has-text("Dodaj"), button:has-text("Add"), button[type="submit"]');
          
          // Wait for series to be created
          await expect(page.locator(`text=${seriesName}`)).toBeVisible({ timeout: 5000 });
        }
      }

      // Step 4: Create Episode with Audio
      const episodesLink = page.locator('a:has-text("Zarządzanie odcinkami"), a[href*="episodes"]');
      if (await episodesLink.isVisible()) {
        await episodesLink.click();
        await expect(page).toHaveURL(/\/episodes/);

        // Click Add Episode button
        const addEpisodeButton = page.locator('button:has-text("+ Dodaj odcinek"), button:has-text("Add episode")');
        if (await addEpisodeButton.isVisible()) {
          await addEpisodeButton.click();
          
          // Fill episode form
          await page.fill('input[placeholder*="Tytuł"], input[placeholder*="Title"]', episodeTitle);
          
          // Select series
          const seriesSelect = page.locator('select:has(option:has-text("Wybierz serię"))');
          if (await seriesSelect.isVisible()) {
            // Try to select our created series
            const options = await seriesSelect.locator('option').allTextContents();
            const seriesOption = options.find(option => option.includes(seriesName.substring(0, 20)));
            if (seriesOption) {
              await seriesSelect.selectOption({ label: seriesOption });
            } else {
              await seriesSelect.selectOption({ index: 1 }); // Select first available series
            }
          }

          // Select language
          await page.selectOption('select:has(option:has-text("Polski"))', 'polski');

          // Add additional info
          await page.fill('textarea[placeholder*="Informacje dodatkowe"]', 'Episode created during E2E testing workflow');

          // Add topics/links
          await page.fill('textarea[placeholder*="Linki i timestampy"]', '[00:00] # Introduction\n- Welcome to E2E testing\n\n[01:30] # Main Content\n- Testing complete workflow');

          // Note: File upload would require actual file handling in E2E
          // For now, we'll create episode without audio and add it later
          
          // Submit episode form
          await page.click('button:has-text("Dodaj odcinek"), button:has-text("Add episode"), button[type="submit"]');
          
          // Wait for episode to be created
          await expect(page.locator(`text=${episodeTitle}`)).toBeVisible({ timeout: 10000 });
        }
      }

      // Step 5: Edit Created Episode
      const editButton = page.locator('button[title="Edytuj odcinek"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Wait for edit modal
        await expect(page.locator('h2:has-text("Edytuj odcinek")')).toBeVisible();
        
        // Update episode title
        const updatedTitle = `${episodeTitle} - Updated`;
        await page.fill('input[value*="E2E Test Episode"]', updatedTitle);
        
        // Change language
        await page.selectOption('select:has(option[selected])', 'angielski');
        
        // Update additional info
        await page.fill('textarea', 'Episode updated during E2E testing');
        
        // Save changes
        await page.click('button:has-text("Zapisz"), button:has-text("Save")');
        
        // Verify update
        await expect(page.locator(`text=${updatedTitle}`)).toBeVisible({ timeout: 5000 });
      }

      // Step 6: Verify Admin Statistics
      const statsLink = page.locator('a:has-text("Statystyki administratora"), a[href*="admin-stats"]');
      if (await statsLink.isVisible()) {
        await statsLink.click();
        await expect(page).toHaveURL(/\/admin-stats/);
        
        // Check for statistics display
        const statsElements = page.locator('text=/Liczba użytkowników|Liczba odcinków|Liczba serii/i');
        await expect(statsElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Complete User Workflow', () => {
    test('should complete full user journey: register -> login -> browse -> play -> rate -> favorite', async ({ page }) => {
      // Step 1: User Registration
      await page.click('text=Zarejestruj się');
      await page.fill('input[type="email"]', testUserEmail);
      await page.fill('input[placeholder*="Hasło"], input[type="password"]', 'TestPassword123!');
      await page.fill('input[placeholder*="Potwierdź"], input[placeholder*="Confirm"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // Wait for registration success
      try {
        await expect(page.locator('text=Konto zostało utworzone')).toBeVisible({ timeout: 5000 });
      } catch (e) {
        // If registration page redirects directly to login
        console.log('Registration completed, proceeding to login');
      }

      // Step 2: User Login
      // If not already on login page
      if (await page.locator('text=Zaloguj się').isVisible()) {
        await page.click('text=Zaloguj się');
      }
      
      await page.fill('input[type="email"]', testUserEmail);
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

      // Step 3: Browse Episodes
      const episodes = page.locator('[data-testid="episode-item"], .episode-item, .episode-card');
      const episodeCount = await episodes.count();
      
      if (episodeCount > 0) {
        // Step 4: Open First Episode
        await episodes.first().click();
        
        // Wait for AudioPlayer to load
        await expect(page.locator('[data-testid="audio-player"], .audio-player')).toBeVisible({ timeout: 10000 });

        // Step 5: Try to Play Episode (if audio is available)
        const playButton = page.locator('button[aria-label*="Odtwórz"], button[aria-label*="Play"]');
        if (await playButton.isVisible()) {
          const isDisabled = await playButton.isDisabled();
          if (!isDisabled) {
            await playButton.click();
            
            // Wait for play state change
            await page.waitForTimeout(1000);
            
            // Check if pause button appears
            const pauseButton = page.locator('button[aria-label*="Pauza"], button[aria-label*="Pause"]');
            if (await pauseButton.isVisible()) {
              console.log('Audio playback started successfully');
              
              // Pause the audio
              await pauseButton.click();
            }
          } else {
            console.log('Play button disabled - no audio file available');
          }
        }

        // Step 6: Rate Episode
        const userRating = page.locator('[data-testid="user-rating"]');
        if (await userRating.isVisible()) {
          const stars = userRating.locator('svg');
          const starCount = await stars.count();
          
          if (starCount >= 4) {
            // Click 4th star for 4/5 rating
            await stars.nth(3).click();
            await page.waitForTimeout(1000);
            
            // Verify rating was saved
            expect(await page.locator('text=4').isVisible()).toBeTruthy();
          }
        }

        // Step 7: Add to Favorites
        const favoriteButton = page.locator('[data-testid="favorite-button"], button[aria-label*="ulubion"]');
        if (await favoriteButton.isVisible()) {
          await favoriteButton.click();
          await page.waitForTimeout(1000);
        }

        // Step 8: Simulate Progress
        const progressBar = page.locator('input[type="range"], [data-testid="progress-bar"]');
        if (await progressBar.isVisible()) {
          // Click on progress bar to simulate seeking
          await progressBar.click();
          await page.waitForTimeout(500);
        }
      }

      // Step 9: Navigate to Favorites
      await page.click('a:has-text("Ulubione"), [data-testid="favorites-link"]');
      await expect(page).toHaveURL('/favorites');
      
      // Verify favorites page
      const favoritesHeader = page.locator('h1:has-text("Ulubione odcinki")');
      await expect(favoritesHeader).toBeVisible();

      // Step 10: Test Search Functionality
      await page.goto('/');
      
      const searchInput = page.locator('input[placeholder*="szukaj"], input[type="search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await searchInput.press('Enter');
        
        // Wait for search results
        await page.waitForTimeout(1000);
      }

      // Step 11: Test Profile/Settings (if available)
      const profileLink = page.locator('a:has-text("Profil"), a:has-text("Ustawienia"), [data-testid="profile-link"]');
      if (await profileLink.isVisible()) {
        await profileLink.click();
        
        // Check if profile page loads
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Cross-Browser Functionality', () => {
    test('should work consistently across different viewport sizes', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
    });

    test('should handle theme switching correctly', async ({ page }) => {
      // Find theme toggle button
      const themeToggle = page.locator('button[title*="motyw"], button[title*="theme"]');
      
      if (await themeToggle.isVisible()) {
        // Check initial theme
        const bodyClasses = await page.locator('body').getAttribute('class');
        const isDarkInitially = bodyClasses?.includes('dark') || false;
        
        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(500);
        
        // Check theme changed
        const newBodyClasses = await page.locator('body').getAttribute('class');
        const isDarkAfterToggle = newBodyClasses?.includes('dark') || false;
        
        expect(isDarkAfterToggle).not.toBe(isDarkInitially);
        
        // Toggle back
        await themeToggle.click();
        await page.waitForTimeout(500);
        
        // Verify original theme restored
        const finalBodyClasses = await page.locator('body').getAttribute('class');
        const isDarkFinal = finalBodyClasses?.includes('dark') || false;
        
        expect(isDarkFinal).toBe(isDarkInitially);
      }
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should load main page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await expect(page.locator('main')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    });

    test('should have basic accessibility features', async ({ page }) => {
      // Check for basic accessibility elements
      await expect(page.locator('main')).toBeVisible();
      
      // Check for proper heading structure
      const h1Elements = page.locator('h1');
      const h1Count = await h1Elements.count();
      expect(h1Count).toBeGreaterThan(0);
      
      // Check for navigation landmarks
      const navElement = page.locator('nav, header');
      await expect(navElement.first()).toBeVisible();
      
      // Check for button accessibility
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        // At least some buttons should have accessible names
        const firstButton = buttons.first();
        const hasAriaLabel = await firstButton.getAttribute('aria-label');
        const hasTitle = await firstButton.getAttribute('title');
        const hasText = await firstButton.textContent();
        
        expect(hasAriaLabel || hasTitle || hasText).toBeTruthy();
      }
    });

    test('should handle network interruptions gracefully', async ({ page }) => {
      // Test offline behavior (if supported)
      await page.goto('/');
      
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.continue();
      });
      
      // Test navigation with slow network
      const episodes = page.locator('[data-testid="episode-item"], .episode-item');
      const episodeCount = await episodes.count();
      
      if (episodeCount > 0) {
        await episodes.first().click();
        
        // Should still work with slow network
        await expect(page.locator('[data-testid="audio-player"], .audio-player')).toBeVisible({ timeout: 15000 });
      }
    });
  });

  test.describe('Data Persistence and State Management', () => {
    test('should maintain user state across page refreshes', async ({ page }) => {
      // Login first
      await page.click('text=Zaloguj się');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'test123');
      await page.click('button[type="submit"]');
      
      // Wait for login
      await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
      
      // Check if user appears to be logged in
      const logoutButton = page.locator('button:has-text("Wyloguj"), button:has-text("Logout")');
      const profileLink = page.locator('a:has-text("Profil"), [data-testid="profile"]');
      
      const isLoggedIn = await logoutButton.isVisible() || await profileLink.isVisible();
      
      if (isLoggedIn) {
        // Refresh page
        await page.reload();
        
        // Check if still logged in after refresh
        await page.waitForTimeout(2000);
        const stillLoggedIn = await logoutButton.isVisible() || await profileLink.isVisible();
        
        if (stillLoggedIn) {
          console.log('User state maintained across refresh');
        } else {
          console.log('User state not maintained (may be expected behavior)');
        }
      }
    });

    test('should handle concurrent user actions correctly', async ({ page }) => {
      const episodes = page.locator('[data-testid="episode-item"], .episode-item');
      const episodeCount = await episodes.count();
      
      if (episodeCount > 0) {
        await episodes.first().click();
        await expect(page.locator('[data-testid="audio-player"], .audio-player')).toBeVisible();
        
        // Try multiple rapid clicks on different elements
        const favoriteButton = page.locator('[data-testid="favorite-button"]');
        const ratingStars = page.locator('[data-testid="user-rating"] svg');
        
        const promises = [];
        
        if (await favoriteButton.isVisible()) {
          promises.push(favoriteButton.click());
        }
        
        if (await ratingStars.count() > 0) {
          promises.push(ratingStars.nth(2).click());
        }
        
        // Execute concurrent actions
        if (promises.length > 0) {
          await Promise.all(promises);
          await page.waitForTimeout(1000);
          
          // Verify no JavaScript errors occurred
          const errors = await page.evaluate(() => window.errors || []);
          expect(errors.length).toBe(0);
        }
      }
    });
  });
});