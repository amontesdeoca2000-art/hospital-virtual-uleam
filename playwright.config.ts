import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--no-sandbox'],
    },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'movil',
      use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
})
