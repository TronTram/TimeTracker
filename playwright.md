# Playwright Testing Guide

This project uses Playwright for end-to-end testing. Playwright enables reliable end-to-end testing for modern web apps.

## Installation

Playwright is already installed in this project. To set up Playwright browsers:

```bash
# Install browsers only
npm run test:install

# Install browsers with system dependencies (recommended)
npm run test:install-deps
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests with UI mode (interactive debugging)
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Show test report
npm run test:report
```

### Specific Test Commands

```bash
# Run the implemented Pomodoro Timer Operations tests
npm test tests/dashboard-pomodoro.spec.ts -g "Pomodoro Timer Operations"

# Run a specific test file
npm test tests/example.spec.ts

# Run tests matching a pattern
npm test -- --grep "timer"

# View all available tests
npx playwright test --list
```

### Development Commands

```bash
# Run with browser visible for debugging
npm run test:headed tests/dashboard-pomodoro.spec.ts

# Run specific test in debug mode
npm run test:debug tests/example.spec.ts

# Generate tests with codegen
npx playwright codegen http://localhost:3001
```

## Configuration

The Playwright configuration is in `playwright.config.ts`. Key features:

- **Multi-browser testing**: Chrome, Firefox, Safari
- **Mobile testing**: Pixel 5, iPhone 12
- **Automatic server startup**: Starts dev server before tests
- **Retry logic**: Retries failed tests on CI
- **Trace collection**: Records traces for debugging
- **Screenshots/Videos**: Captures on failure

## Test Structure

Tests are located in the `tests/` directory:

- `tests/example.spec.ts` - Basic functionality tests
- `tests/dashboard-pomodoro.spec.ts` - Pomodoro timer specific tests

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for elements** instead of using timeouts
3. **Use page.locator()** for modern element handling
4. **Test user flows** rather than individual components
5. **Keep tests isolated** - each test should be independent

## Debugging

### Visual Debugging
```bash
# Run with UI mode for interactive debugging
npm run test:ui

# Run with headed mode to see browser
npm run test:headed
```

### Trace Viewer
```bash
# View traces of failed tests
npx playwright show-trace test-results/path-to-trace.zip
```

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots (`test-results/`)
- Videos (`test-results/`)
- Traces (`test-results/`)

## CI/CD

A GitHub Actions workflow is included (`.github/workflows/playwright.yml`) that:
- Runs tests on push/PR
- Tests on multiple browsers
- Uploads test reports as artifacts
- Caches dependencies for faster runs

## Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)