import { expect, test } from '@playwright/test';
import { signIn, uniqueName } from './helpers';

test('ajoute, modifie, filtre puis supprime un animal', async ({ page }) => {
  const name = uniqueName('Mistigri');
  await signIn(page);

  // Ajout
  await page.getByLabel('Nom *').first().fill(name);
  await page.locator('#animal-species').selectOption('CAT');
  await page.getByRole('button', { name: 'Ajouter' }).click();
  const card = page.locator('article', { hasText: name });
  await expect(card).toBeVisible();
  await expect(card).toContainText('Chat');

  // Modification
  await card.getByRole('button', { name: 'Modifier' }).click();
  await page.locator('#edit-breed').fill('Européen');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.locator('article', { hasText: name })).toContainText('Européen');

  // Filtre par espèce
  await page.locator('#species-filter').selectOption('DOG');
  await expect(page.locator('article', { hasText: name })).toHaveCount(0);
  await page.locator('#species-filter').selectOption('CAT');
  await expect(page.locator('article', { hasText: name })).toBeVisible();

  // Suppression avec confirmation
  const toDelete = page.locator('article', { hasText: name });
  await toDelete.getByRole('button', { name: 'Supprimer' }).click();
  await toDelete.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.locator('article', { hasText: name })).toHaveCount(0);
});

test("refuse deux animaux du même nom et l'explique", async ({ page }) => {
  const name = uniqueName('Doublon');
  await signIn(page);
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByLabel('Nom *').first().fill(name);
    await page.getByRole('button', { name: 'Ajouter' }).click();
    if (attempt === 0) await expect(page.locator('article', { hasText: name })).toBeVisible();
  }
  await expect(page.getByRole('status').filter({ hasText: 'existe déjà' })).toBeVisible();
  const card = page.locator('article', { hasText: name });
  await card.getByRole('button', { name: 'Supprimer' }).click();
  await card.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.locator('article', { hasText: name })).toHaveCount(0);
});
