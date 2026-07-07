// @ts-check
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from the .env file (baseURL, basic auth credentials)
dotenv.config();

/**
 * Playwright configuration.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './tests',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',

    /* Shared settings for all the projects below. */
    use: {
        /* Base URL taken from the environment (.env) */
        baseURL: process.env.BASE_URL,

        /* Basic auth credentials taken from the environment (.env) */
        httpCredentials: {
            username: process.env.HTTP_CREDENTIALS_USERNAME ?? '',
            password: process.env.HTTP_CREDENTIALS_PASSWORD ?? '',
        },

        /* Collect trace, screenshot and video only when something fails — keeps runs light */
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
});
