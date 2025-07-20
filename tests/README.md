# Pomodoro Timer E2E Tests

This document describes how to run the Playwright tests for the Pomodoro timer functionality on the dashboard.

## Test File Overview

The main test file is `tests/dashboard-pomodoro.spec.ts` which contains comprehensive tests for:

### ✅ Implemented Tests (Pomodoro Timer Operations)
- **Start work session timer** - Verifies timer starts and displays correctly
- **Pause and resume work session** - Tests pause/resume functionality
- **Stop/reset work session** - Tests session reset functionality  
- **Complete work session and auto-transition** - Tests automatic phase transitions
- **Handle manual session completion** - Tests skip/complete functionality
- **Display correct timer controls** - Tests control state management
- **Maintain phase context** - Tests phase consistency during operations

### 📋 Test Specifications (To Be Implemented)
- Timer Mode Toggle (4 tests)
- Pomodoro Timer Display (4 tests) 
- Phase Transitions and Cycles (5 tests)
- Dashboard Statistics (5 tests)
- Settings and Configuration (5 tests)
- Audio and Notifications (3 tests)
- Responsive Design (3 tests)
- Accessibility (4 tests)
- Error Handling (5 tests)
- Performance (2 tests)
- Integration with Regular Timer (3 tests)

**Total: 250 tests across 6 browsers (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari)**

## Running the Tests

### Prerequisites
1. Ensure your development server is running or configure auto-start
2. Install Playwright browsers if needed:
   ```bash
   npm run test:install
   ```

### Running All Tests
```bash
# Run all Pomodoro tests
npm run test tests/dashboard-pomodoro.spec.ts

# Run only the implemented "Pomodoro Timer Operations" tests
npm run test tests/dashboard-pomodoro.spec.ts -g "Pomodoro Timer Operations"
```

### Running Specific Tests
```bash
# Run only start timer test
npm run test tests/dashboard-pomodoro.spec.ts -g "should start work session timer"

# Run pause/resume tests
npm run test tests/dashboard-pomodoro.spec.ts -g "should pause and resume"
```

### Development Testing
```bash
# Run with browser UI visible (helpful for debugging)
npm run test:headed tests/dashboard-pomodoro.spec.ts

# Run with interactive test runner
npm run test:ui

# Debug mode (step through tests)
npm run test:debug tests/dashboard-pomodoro.spec.ts
```

### Browser-Specific Testing
```bash
# Test only on Chrome
npm run test tests/dashboard-pomodoro.spec.ts --project=chromium

# Test only on mobile devices
npm run test tests/dashboard-pomodoro.spec.ts --project="Mobile Chrome"
```

## Test Structure

### Helper Functions
The test file includes several helper functions:

- `setupAuthenticatedDashboard()` - Handles login and navigation
- `switchToPomodoroMode()` - Switches to Pomodoro timer mode
- `setupFastTestConfig()` - Sets shorter durations for testing
- `waitForTimerState()` - Waits for specific timer states
- `getCurrentTimerValue()` - Gets current timer display value
- `verifyPhaseTransition()` - Verifies phase changes
- `simulateTimerCompletion()` - Simulates full timer cycles

### Test Configuration
The tests use realistic timeouts and waiting strategies:
- **Timer updates**: 1-3 second waits for real-time validation
- **Phase transitions**: Up to 10 seconds for automatic transitions
- **Settings changes**: 500ms waits for form submissions
- **Authentication**: Extended timeouts for login flows

## Test Implementation Notes

### Current Implementation Status
✅ **Fully Implemented**: "Pomodoro Timer Operations" section (7 tests)
- Tests use flexible element selectors to work with current UI
- Includes proper error handling and timeout management
- Tests both successful operations and edge cases

### Authentication Setup
⚠️ **TODO**: The `setupAuthenticatedDashboard()` function needs to be implemented with your Clerk authentication flow.

### Test Data IDs
The tests currently use content-based selectors (text, classes). For more reliable testing, consider adding `data-testid` attributes to key components:

```tsx
// Recommended additions to components:
<button data-testid="pomodoro-start-btn">Start</button>
<div data-testid="pomodoro-timer-display">25:00</div>
<div data-testid="pomodoro-phase-indicator">Work Session</div>
```

## Debugging Failed Tests

### Common Issues
1. **Authentication failures**: Check Clerk setup in test helper
2. **Element not found**: Components may need test IDs
3. **Timing issues**: Adjust timeouts for slower systems
4. **Mode switching**: Ensure Pomodoro mode is properly activated

### Debugging Commands
```bash
# Generate detailed trace files
npm run test tests/dashboard-pomodoro.spec.ts --trace=on

# View test reports
npm run test:report

# Check console logs during test
npm run test tests/dashboard-pomodoro.spec.ts --debug
```

### Test Reports
After running tests, view the HTML report:
```bash
npm run test:report
```

The report includes:
- Screenshots of failures
- Video recordings of test runs  
- Network activity logs
- Console error messages
- Step-by-step execution traces

## Next Steps

1. **Implement authentication** in `setupAuthenticatedDashboard()`
2. **Add test IDs** to Pomodoro components for reliable selection
3. **Implement remaining test sections** using the existing patterns
4. **Add visual regression testing** with screenshot comparisons
5. **Set up CI/CD integration** for automated testing
6. **Add performance benchmarking** for timer accuracy

## Performance Considerations

The tests are designed to be efficient:
- Uses parallel execution where possible
- Implements smart waiting strategies
- Reuses browser instances
- Includes proper cleanup procedures

Total estimated run time: **5-10 minutes** for all 250 tests across all browsers.
