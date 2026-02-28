import { defineConfig } from '@playwright/test';

/**
 * Tests de bout en bout : ils supposent que la pile tourne déjà
 * (docker compose up -d, API sur 3300, interface sur 5273).
 * Chrome installé sur la machine est utilisé : rien à télécharger.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: process.env.JANE_WEB_URL ?? 'http://localhost:5273',
    channel: 'chrome',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
  },
  outputDir: './test-results',
});
