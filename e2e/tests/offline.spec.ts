import { expect, test } from '@playwright/test';
import { signIn, uniqueName } from './helpers';

/**
 * Parcours hors ligne complet. Il faut la version de production (le service worker n'existe pas en développement) :
 *   cd frontend && npm run build:preview && npm run preview:e2e      (puis, dans e2e/ : npm run test:offline)
 */
test.skip(!process.env.JANE_E2E_OFFLINE, 'Lancer avec « npm run test:offline » sur la version de production');

test("saisit hors ligne, rouvre l'application sans réseau, puis envoie tout au retour du réseau", async ({ page, context }) => {
  const name = uniqueName('Terrain');
  await signIn(page);

  // Un animal, puis la page Observation (avec son éthogramme en copie locale)
  await page.getByLabel('Nom *').first().fill(name);
  await page.locator('#animal-species').selectOption('HORSE');
  await page.getByRole('button', { name: 'Ajouter' }).click();
  await expect(page.locator('article', { hasText: name })).toBeVisible();
  await page.locator('#animal-picker').selectOption({ label: `${name} · Cheval` });
  await page.getByRole('link', { name: 'Observation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Piaffer', exact: true })).toBeVisible();

  // Le service worker prend la main, puis on recharge pour que l'application soit entièrement en cache
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Piaffer', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  // Plus de réseau : un événement et un état chronométré sont conservés
  await context.setOffline(true);
  await expect(page.getByText('Hors ligne.')).toBeVisible();
  await page.getByRole('button', { name: 'Piaffer', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'conservé sur cet appareil' })).toBeVisible();
  await page.getByLabel('État', { exact: true }).check();
  await page.getByRole('button', { name: 'Démarrer · Dormir debout' }).click();
  await expect(page.getByRole('heading', { name: /En cours \(1\)/ })).toBeVisible();
  await expect(page.getByText('sur cet appareil', { exact: true })).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Arrêter · Dormir debout' }).click();
  await expect(page.getByText(/3 saisies en attente d'envoi/)).toBeVisible();

  // Rechargement sans réseau : l'application s'ouvre, les saisies sont toujours là
  await page.reload();
  await expect(page.getByText('Hors ligne.')).toBeVisible();
  await expect(page.getByText(/3 saisies en attente d'envoi/)).toBeVisible();
  await expect(page.locator('#animal-picker')).toContainText(name);

  // Le réseau revient : l'application se reconnecte seule et envoie tout
  await context.setOffline(false);
  await expect(page.getByText(/3 saisies en attente d'envoi/)).toHaveCount(0, { timeout: 30_000 });
  await page.getByRole('link', { name: 'Observation', exact: true }).click();
  await expect(page.locator('tbody tr', { hasText: 'Piaffer' })).toBeVisible();
  await expect(page.locator('tbody tr', { hasText: 'Dormir debout' })).toContainText('État');

  // Nettoyage
  await page.getByRole('link', { name: 'Profils', exact: true }).click();
  const card = page.locator('article', { hasText: name });
  await card.getByRole('button', { name: 'Supprimer' }).click();
  await card.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.locator('article', { hasText: name })).toHaveCount(0);
});
