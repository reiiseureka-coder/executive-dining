import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true, timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4180', trace: 'retain-on-failure', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] } : {} },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    { command: 'VITE_DINING_DATABASE_ENABLED=false VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npm run dev -- --host 127.0.0.1 --port 4180', url: 'http://127.0.0.1:4180', reuseExistingServer: false },
    { command: 'VITE_DINING_DATABASE_ENABLED=true VITE_SUPABASE_URL=https://test-project.supabase.co VITE_SUPABASE_ANON_KEY=test-public-key npm run dev -- --host 127.0.0.1 --port 4181', url: 'http://127.0.0.1:4181', reuseExistingServer: false },
  ],
});
