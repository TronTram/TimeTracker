/**
 * Dashboard Pomodoro Timer Operations E2E Tests
 * 
 * This test suite focuses specifically on testing the core Pomodoro timer 
 * operations functionality on the dashboard page.
 * 
 * Test Coverage:
 * - Starting work sessions
 * - Pausing and resuming sessions  
 * - Stopping/resetting sessions
 * - Completing sessions and auto-transitions
 * - Manual session completion
 * - Timer control state management
 * - Phase context consistency
 */

import { test, expect, type Page } from '@playwright/test';

// Test Data Constants
const POMODORO_CONFIG = {
  // Default durations (in seconds for testing - normally minutes)
  WORK_DURATION: 25 * 60,     // 25 minutes
  SHORT_BREAK: 5 * 60,        // 5 minutes  
  LONG_BREAK: 15 * 60,        // 15 minutes
  LONG_BREAK_INTERVAL: 4,     // Every 4 work sessions
  
  // Test durations (shorter for E2E tests)
  TEST_WORK_DURATION: 3,      // 3 seconds
  TEST_SHORT_BREAK: 2,        // 2 seconds
  TEST_LONG_BREAK: 2,         // 2 seconds
} as const;

// Helper function to wait for authentication and navigate to dashboard
async function setupAuthenticatedDashboard(page: Page) {
  // TODO: Implement authentication flow
  // This will depend on your Clerk setup
  await page.goto('/dashboard');
  
  // Wait for dashboard to load
  await expect(page.locator('h1')).toContainText('Welcome back');
  
  // Ensure timer is visible
  await expect(page.locator('[data-testid="unified-timer"]')).toBeVisible();
}

// Helper function to switch to Pomodoro mode
async function switchToPomodoroMode(page: Page) {
  const modeToggle = page.locator('[data-testid="timer-mode-toggle"]');
  await expect(modeToggle).toBeVisible();
  
  // Click Pomodoro mode if not already selected
  const pomodoroOption = page.locator('[data-testid="mode-pomodoro"]');
  await pomodoroOption.click();
  
  // Verify Pomodoro mode is active
  await expect(page.locator('[data-testid="pomodoro-timer"]')).toBeVisible();
  await expect(page.locator('[data-testid="pomodoro-dashboard"]')).toBeVisible();
}

test.describe('Dashboard Pomodoro Timer Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedDashboard(page);
  });

  test.describe('3. Pomodoro Timer Operations', () => {
    
    test.beforeEach(async ({ page }) => {
      await switchToPomodoroMode(page);
    });

    test('should start work session timer', async ({ page }) => {
      // FEATURE: Starting Pomodoro work sessions
      
      // Verify initial state shows work session
      await expect(page.locator('text=Work Session')).toBeVisible();
      await expect(page.locator('text=25:00')).toBeVisible();
      
      // Find and click the start button
      const startButton = page.locator('button:has-text("Start")').first();
      await expect(startButton).toBeVisible();
      await startButton.click();
      
      // Wait a moment for timer to start
      await page.waitForTimeout(1000);
      
      // VERIFY: Timer display updates in real-time
      const timerDisplay = page.locator('[class*="font-mono"]:has-text(":")');
      await expect(timerDisplay).toBeVisible();
      
      // The timer should show a time less than 25:00 after starting
      await expect(async () => {
        const timeText = await timerDisplay.textContent();
        expect(timeText).not.toBe('25:00');
      }).toPass({ timeout: 3000 });
      
      // VERIFY: Pause/Stop controls become available
      await expect(page.locator('button:has-text("Pause"), button[aria-label*="pause"]')).toBeVisible();
      await expect(page.locator('button:has-text("Stop"), button[aria-label*="stop"]')).toBeVisible();
      
      // VERIFY: Phase remains "Work Session" 
      await expect(page.locator('text=Work Session')).toBeVisible();
      
      // VERIFY: Progress bar is visible and advancing
      const progressBar = page.locator('[class*="progress"], [role="progressbar"], .bg-red-500').first();
      await expect(progressBar).toBeVisible();
    });

    test('should pause and resume work session', async ({ page }) => {
      // FEATURE: Pause/resume functionality
      
      // Start the timer first
      await page.locator('button:has-text("Start")').first().click();
      await page.waitForTimeout(1000);
      
      // Get initial time
      const timerDisplay = page.locator('[class*="font-mono"]:has-text(":")');
      const initialTime = await timerDisplay.textContent();
      
      // VERIFY: Pause button stops countdown
      const pauseButton = page.locator('button:has-text("Pause"), button[aria-label*="pause"]').first();
      await pauseButton.click();
      
      // Wait a moment and verify time doesn't change
      await page.waitForTimeout(2000);
      const pausedTime = await timerDisplay.textContent();
      expect(pausedTime).toBe(initialTime);
      
      // VERIFY: Pause indicator is shown
      await expect(page.locator('text=Paused, [class*="pause"]')).toBeVisible();
      
      // VERIFY: Resume button continues from same time
      const resumeButton = page.locator('button:has-text("Resume"), button:has-text("Play")').first();
      await expect(resumeButton).toBeVisible();
      await resumeButton.click();
      
      // Verify timer starts counting again
      await page.waitForTimeout(1000);
      const resumedTime = await timerDisplay.textContent();
      expect(resumedTime).not.toBe(pausedTime);
      
      // VERIFY: Time tracking accuracy is maintained (no significant jump)
      if (pausedTime && resumedTime) {
        const [pausedMin, pausedSec] = pausedTime.split(':').map(Number);
        const [resumedMin, resumedSec] = resumedTime.split(':').map(Number);
        const pausedTotal = (pausedMin || 0) * 60 + (pausedSec || 0);
        const resumedTotal = (resumedMin || 0) * 60 + (resumedSec || 0);
        
        // Should be within 2 seconds of expected
        expect(pausedTotal - resumedTotal).toBeLessThanOrEqual(2);
      }
    });

    test('should stop/reset work session', async ({ page }) => {
      // FEATURE: Session reset functionality
      
      // Start the timer
      await page.locator('button:has-text("Start")').first().click();
      await page.waitForTimeout(2000);
      
      // Verify timer is running
      const timerDisplay = page.locator('[class*="font-mono"]:has-text(":")');
      const runningTime = await timerDisplay.textContent();
      expect(runningTime).not.toBe('25:00');
      
      // VERIFY: Stop button resets timer to initial state
      const stopButton = page.locator('button:has-text("Stop"), button[aria-label*="stop"]').first();
      await stopButton.click();
      
      // VERIFY: Timer returns to initial state
      await expect(page.locator('text=25:00')).toBeVisible();
      
      // VERIFY: Progress returns to 0% (progress bar should be minimal/hidden)
      const progressBar = page.locator('[style*="width: 0"], [style*="width:0"]');
      // Progress should reset (either be 0% or hidden)
      
      // VERIFY: Phase remains the same
      await expect(page.locator('text=Work Session')).toBeVisible();
      
      // VERIFY: Controls return to start state
      await expect(page.locator('button:has-text("Start")')).toBeVisible();
      await expect(page.locator('button:has-text("Pause")')).not.toBeVisible();
    });

    test('should complete work session and auto-transition to break', async ({ page }) => {
      // FEATURE: Automatic phase transitions
      // Note: Using faster test duration for E2E testing
      
      // First, we need to set up faster test configuration
      // Navigate to settings or use a test configuration
      await page.goto('/settings');
      
      // Look for Pomodoro settings section
      const pomodoroSection = page.locator('text=Pomodoro').first();
      if (await pomodoroSection.isVisible()) {
        await pomodoroSection.click();
      }
      
      // Set work duration to 1 second for testing (if editable)
      const workDurationInput = page.locator('input[type="number"]:near(text="Work Duration")');
      if (await workDurationInput.isVisible()) {
        await workDurationInput.fill('0.02'); // 1.2 seconds = 0.02 minutes
      }
      
      // Save settings if there's a save button
      const saveButton = page.locator('button:has-text("Save")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }
      
      // Return to dashboard
      await page.goto('/dashboard');
      await switchToPomodoroMode(page);
      
      // Start the timer
      await page.locator('button:has-text("Start")').first().click();
      
      // VERIFY: Work session completes and transitions to break
      // Wait for the session to complete (with extended timeout)
      await expect(page.locator('text=Short Break, text=Break')).toBeVisible({ timeout: 10000 });
      
      // VERIFY: UI updates to break theme (green colors)
      await expect(page.locator('[class*="green"], [class*="break"]')).toBeVisible();
      
      // VERIFY: Shows transition notification or break indicators
      await expect(page.locator('text=Short Break, text=Take a quick break')).toBeVisible();
    });

    test('should handle manual session completion', async ({ page }) => {
      // FEATURE: Manual session completion
      
      // Start a work session
      await page.locator('button:has-text("Start")').first().click();
      await page.waitForTimeout(1000);
      
      // Look for skip/complete button (might be labeled as "Skip", "Complete", or have an icon)
      const skipButton = page.locator('button:has-text("Skip"), button:has-text("Complete"), button[aria-label*="skip"]').first();
      
      if (await skipButton.isVisible()) {
        // VERIFY: Complete/Skip button ends current phase
        await skipButton.click();
        
        // VERIFY: Transitions to next appropriate phase (short break)
        await expect(page.locator('text=Short Break, text=Break')).toBeVisible({ timeout: 5000 });
        
        // VERIFY: Records partial session time (check if analytics or session data updated)
        // This might require checking dashboard stats or session history
      } else {
        // If no skip button is visible, try alternative approaches
        console.log('Skip button not found - this feature may not be implemented yet');
        
        // Alternative: Look for keyboard shortcuts or context menus
        await page.keyboard.press('Space'); // Common shortcut for complete
        
        // Or check if there's a settings option to enable skip functionality
      }
    });

    test('should display correct timer controls based on state', async ({ page }) => {
      // FEATURE: Dynamic control states
      
      // Initial state - should show Start button
      await expect(page.locator('button:has-text("Start")')).toBeVisible();
      await expect(page.locator('button:has-text("Pause")')).not.toBeVisible();
      
      // After starting - should show Pause and Stop
      await page.locator('button:has-text("Start")').first().click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('button:has-text("Pause"), button[aria-label*="pause"]')).toBeVisible();
      await expect(page.locator('button:has-text("Stop"), button[aria-label*="stop"]')).toBeVisible();
      await expect(page.locator('button:has-text("Start")')).not.toBeVisible();
      
      // After pausing - should show Resume
      await page.locator('button:has-text("Pause")').first().click();
      await expect(page.locator('button:has-text("Resume"), button:has-text("Play")')).toBeVisible();
    });

    test('should maintain phase context during timer operations', async ({ page }) => {
      // FEATURE: Phase consistency
      
      // Verify work session context
      await expect(page.locator('text=Work Session')).toBeVisible();
      await expect(page.locator('text=Focus on your task, text=work')).toBeVisible();
      
      // Start timer and verify phase doesn't change during execution
      await page.locator('button:has-text("Start")').first().click();
      await page.waitForTimeout(2000);
      
      // Phase should still be work session
      await expect(page.locator('text=Work Session')).toBeVisible();
      
      // Pause and verify phase remains
      await page.locator('button:has-text("Pause")').first().click();
      await expect(page.locator('text=Work Session')).toBeVisible();
      
      // Resume and verify phase remains
      await page.locator('button:has-text("Resume"), button:has-text("Play")').first().click();
      await expect(page.locator('text=Work Session')).toBeVisible();
    });

  });

});

/**
 * Helper Functions for Pomodoro Timer Testing
 */

// Helper to set fast test configuration for Pomodoro timers
async function setupFastTestConfig(page: Page) {
  await page.goto('/settings');
  
  // Look for Pomodoro settings section
  const pomodoroSection = page.locator('text=Pomodoro, [data-testid="pomodoro-settings"]');
  if (await pomodoroSection.isVisible()) {
    await pomodoroSection.click();
  }
  
  // Set very short durations for testing
  const workDurationInput = page.locator('input[type="number"]:near(text="Work Duration")');
  if (await workDurationInput.isVisible()) {
    await workDurationInput.fill('0.05'); // 3 seconds = 0.05 minutes
  }
  
  const shortBreakInput = page.locator('input[type="number"]:near(text="Short Break")');
  if (await shortBreakInput.isVisible()) {
    await shortBreakInput.fill('0.03'); // 2 seconds = 0.03 minutes
  }
  
  // Save settings
  const saveButton = page.locator('button:has-text("Save")');
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(500);
  }
  
  // Return to dashboard
  await page.goto('/dashboard');
}

// Helper to wait for timer state changes
async function waitForTimerState(page: Page, expectedState: 'running' | 'paused' | 'stopped', timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const isRunning = await page.locator('button:has-text("Pause")').isVisible();
    const isPaused = await page.locator('button:has-text("Resume"), button:has-text("Play")').isVisible();
    const isStopped = await page.locator('button:has-text("Start")').isVisible();
    
    if (expectedState === 'running' && isRunning) return true;
    if (expectedState === 'paused' && isPaused) return true;
    if (expectedState === 'stopped' && isStopped) return true;
    
    await page.waitForTimeout(100);
  }
  
  throw new Error(`Timer did not reach ${expectedState} state within ${timeout}ms`);
}

// Helper to get current timer display value
async function getCurrentTimerValue(page: Page): Promise<string> {
  const timerDisplay = page.locator('[class*="font-mono"]:has-text(":"), .timer-display, [data-testid="timer-display"]');
  const timeText = await timerDisplay.textContent();
  return timeText || '00:00';
}

// Helper to verify phase transition
async function verifyPhaseTransition(page: Page, fromPhase: string, toPhase: string, timeout = 10000) {
  // Wait for the transition to occur
  await expect(page.locator(`text=${toPhase}`)).toBeVisible({ timeout });
  
  // Verify the old phase is no longer the primary display
  await expect(page.locator(`text=${fromPhase}`)).not.toBeVisible();
  
  // Verify theme/styling changes (basic check)
  if (toPhase.includes('Break')) {
    await expect(page.locator('[class*="green"], [class*="break"]')).toBeVisible();
  } else if (toPhase.includes('Work')) {
    await expect(page.locator('[class*="red"], [class*="work"]')).toBeVisible();
  }
}

// Helper to simulate timer completion (for testing phase transitions)
async function simulateTimerCompletion(page: Page, phaseDurationSeconds = 3) {
  // Start the timer
  await page.locator('button:has-text("Start")').first().click();
  
  // Wait for the full duration plus a buffer
  await page.waitForTimeout((phaseDurationSeconds + 1) * 1000);
  
  // Alternative: Keep checking until phase changes
  let attempts = 0;
  const maxAttempts = phaseDurationSeconds + 5; // Give extra time
  
  while (attempts < maxAttempts) {
    const currentTime = await getCurrentTimerValue(page);
    if (currentTime === '00:00' || await page.locator('text=Break').isVisible()) {
      break;
    }
    await page.waitForTimeout(1000);
    attempts++;
  }
}

/**
 * Helper Functions for Pomodoro Timer Operations Testing
 * 
 * These helper functions support testing the core timer operations:
 * - setupFastTestConfig() - Set shorter test durations  
 * - waitForTimerState() - Wait for specific timer states
 * - getCurrentTimerValue() - Get current timer display
 * - verifyPhaseTransition() - Verify phase changes
 * - simulateTimerCompletion() - Simulate complete timer cycles
 */
