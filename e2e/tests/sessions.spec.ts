import { expect, test } from '@playwright/test';
import { signIn, uniqueName } from './helpers';

test('mène une séance : démarrage, observations rattachées, fin, liste et suppression', async ({ page }) => {
  const name = uniqueName('Séance');
  await signIn(page);
  await page.getByLabel('Nom *').first().fill(name);
  await page.getByRole('button', { name: 'Ajouter' }).click();
  await expect(page.locator('article', { hasText: name })).toBeVisible();
  await page.locator('#animal-picker').selectOption({ label: `${name} · Chien` });
  await page.getByRole('link', { name: 'Observation', exact: true }).click();

  // Démarrer une séance focale
  await page.locator('#session-observer').fill('Marie');
  await page.locator('#session-method').selectOption('FOCAL');
  await page.getByRole('button', { name: 'Démarrer une séance' }).click();
  await expect(page.getByText('En cours', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('méthode focal')).toBeVisible();

  // Deux observations pendant la séance
  await page.getByRole('button', { name: 'Aboyer', exact: true }).click();
  await expect(page.getByText('2 observation(s)').or(page.getByText('1 observation(s)'))).toBeVisible();
  await page.getByRole('button', { name: 'Courir', exact: true }).click();
  await expect(page.getByText('2 observation(s) pour l\'instant')).toBeVisible();

  // Terminer
  await page.locator('input[aria-label="Remarque de fin de séance"]').fill('Calme');
  await page.getByRole('button', { name: 'Terminer la séance' }).click();
  await expect(page.getByRole('button', { name: 'Démarrer une séance' })).toBeVisible();

  // La séance apparaît dans Données, avec son observateur et ses 2 observations
  await page.getByRole('link', { name: 'Données', exact: true }).click();
  const row = page.locator('tbody tr', { hasText: 'Marie' });
  await expect(row).toContainText('Focal');
  await expect(row).toContainText('2');
  await row.getByRole('button', { name: 'Supprimer' }).click();
  await row.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.getByText('Aucune séance enregistrée pour cet animal.')).toBeVisible();
  // Les observations sont conservées
  await expect(page.locator('tbody tr', { hasText: 'Aboyer' })).toBeVisible();

  await page.getByRole('link', { name: 'Profils', exact: true }).click();
  const card = page.locator('article', { hasText: name });
  await card.getByRole('button', { name: 'Supprimer' }).click();
  await card.getByRole('button', { name: 'Confirmer' }).click();
});
