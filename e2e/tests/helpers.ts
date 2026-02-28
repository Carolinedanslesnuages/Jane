import { expect, Page } from '@playwright/test';

export const DEMO_EMAIL = process.env.JANE_DEMO_EMAIL ?? 'demo@jane.test';
export const DEMO_PASSWORD = process.env.JANE_DEMO_PASSWORD ?? 'demo-jane';

/** Opens Jane and signs in through the Keycloak login page. */
export async function signIn(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForURL(/\/realms\/jane\//);
  await page.locator('#username').fill(DEMO_EMAIL);
  await page.locator('#password').fill(DEMO_PASSWORD);
  await page.locator('#kc-login').click();
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
}

/** A name that cannot collide with an existing animal, so tests can run on a used database. */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now().toString(36)}`;
}
