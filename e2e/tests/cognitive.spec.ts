import { expect, test } from '@playwright/test';
import { signIn, uniqueName } from './helpers';

test('enregistre, corrige puis supprime un test cognitif', async ({ page }) => {
  const name = uniqueName('Testé');
  await signIn(page);
  await page.getByLabel('Nom *').first().fill(name);
  await page.getByRole('button', { name: 'Ajouter' }).click();
  await expect(page.locator('article', { hasText: name })).toBeVisible();
  await page.locator('#animal-picker').selectOption({ label: `${name} · Chien` });
  await page.getByRole('link', { name: 'Tests cognitifs', exact: true }).click();

  // Chronomètre puis enregistrement
  await page.getByRole('button', { name: 'Démarrer', exact: true }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Arrêter', exact: true }).click();
  await expect(page.locator('#result-duration')).not.toHaveValue('0');
  await page.locator('#result-duration').fill('12.5');
  await page.getByLabel('Renseigner un score').check();
  await page.getByLabel('Score sur 10').fill('7');
  await page.getByRole('button', { name: 'Enregistrer le test' }).click();
  const row = page.locator('tbody tr', { hasText: 'Permanence' });
  await expect(row).toContainText('12,5 s');
  await expect(row).toContainText('7');

  // Correction : durée et effacement du score
  await row.getByRole('button', { name: 'Modifier' }).click();
  await page.getByLabel('Durée en secondes').fill('30');
  await page.getByLabel('Score sur 10 (vide pour effacer)').fill('');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.locator('tbody tr', { hasText: 'Permanence' })).toContainText('30,0 s');
  await expect(page.locator('tbody tr', { hasText: 'Permanence' })).toContainText('–');

  // Suppression
  const corrected = page.locator('tbody tr', { hasText: 'Permanence' });
  await corrected.getByRole('button', { name: 'Supprimer' }).click();
  await corrected.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.getByText('Aucun test enregistré pour cet animal.')).toBeVisible();

  await page.getByRole('link', { name: 'Profils', exact: true }).click();
  const card = page.locator('article', { hasText: name });
  await card.getByRole('button', { name: 'Supprimer' }).click();
  await card.getByRole('button', { name: 'Confirmer' }).click();
});
