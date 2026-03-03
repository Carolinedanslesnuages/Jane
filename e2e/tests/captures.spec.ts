import { test } from '@playwright/test';
import { signIn } from './helpers';

/**
 * Prend une capture de chaque page dans e2e/captures/ (ignoré par git) pour relire l'interface.
 * Lancer avec : npm run captures
 */
test.skip(!process.env.CAPTURES, 'Lancer avec « npm run captures »');

const PAGES = [
  ['profils', 'Profils'],
  ['observation', 'Observation'],
  ['tests-cognitifs', 'Tests cognitifs'],
  ['tableau-de-bord', 'Tableau de bord'],
  ['donnees', 'Données'],
  ['a-propos', 'À propos'],
] as const;

for (const [file, label] of PAGES) {
  test(`capture : ${label}`, async ({ page }) => {
    await signIn(page);
    await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: label, exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `captures/${file}.png`, fullPage: true });
  });
}

test('capture : écran étroit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await signIn(page);
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Observation', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'captures/observation-mobile.png', fullPage: true });
});
