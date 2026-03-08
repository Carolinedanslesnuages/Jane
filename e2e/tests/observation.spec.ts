import { expect, Page, test } from '@playwright/test';
import { signIn, uniqueName } from './helpers';

async function createAnimal(page: Page, name: string, species: 'DOG' | 'CAT' | 'HORSE' | 'OTHER') {
  await page.getByLabel('Nom *').first().fill(name);
  await page.locator('#animal-species').selectOption(species);
  await page.getByRole('button', { name: 'Ajouter' }).click();
  await expect(page.locator('article', { hasText: name })).toBeVisible();
}

async function removeAnimal(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Profils' }).click();
  const card = page.locator('article', { hasText: name });
  await card.getByRole('button', { name: 'Supprimer' }).click();
  await card.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.locator('article', { hasText: name })).toHaveCount(0);
}

test("un chat se voit proposer les comportements du chat, un chien ceux du chien", async ({ page }) => {
  const cat = uniqueName('Chaton');
  const dog = uniqueName('Chiot');
  await signIn(page);
  await createAnimal(page, cat, 'CAT');
  await createAnimal(page, dog, 'DOG');

  const picker = page.locator('#animal-picker');
  await picker.selectOption({ label: `${cat} · Chat` });
  await page.getByRole('link', { name: 'Observation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ronronner' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aboyer' })).toHaveCount(0);

  await picker.selectOption({ label: `${dog} · Chien` });
  await expect(page.getByRole('button', { name: 'Aboyer' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ronronner' })).toHaveCount(0);

  await removeAnimal(page, cat);
  await removeAnimal(page, dog);
});

test('enregistre un événement puis un état chronométré', async ({ page }) => {
  const name = uniqueName('Observé');
  await signIn(page);
  await createAnimal(page, name, 'DOG');
  await page.locator('#animal-picker').selectOption({ label: `${name} · Chien` });
  await page.getByRole('link', { name: 'Observation', exact: true }).click();

  // Événement avec contexte
  await page.locator('#context-location').selectOption('Jardin');
  await page.getByRole('button', { name: 'Aboyer', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Aboyer enregistré' })).toBeVisible();
  await expect(page.locator('tbody tr', { hasText: 'Aboyer' })).toContainText('Jardin');

  // État : démarrer, voir « en cours », arrêter
  await page.getByLabel('État', { exact: true }).check();
  await page.getByRole('button', { name: 'Démarrer · Dormir' }).click();
  await expect(page.getByRole('heading', { name: /En cours \(1\)/ })).toBeVisible();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Arrêter · Dormir' }).click();
  await expect(page.locator('tbody tr', { hasText: 'Dormir' })).toContainText('État');

  await removeAnimal(page, name);
});

test('note un événement et un état après coup, avec leur date', async ({ page }) => {
  const name = uniqueName('Rétro');
  await signIn(page);
  await createAnimal(page, name, 'DOG');
  await page.locator('#animal-picker').selectOption({ label: `${name} · Chien` });
  await page.getByRole('link', { name: 'Observation', exact: true }).click();
  await page.getByLabel('Noter après coup').check();

  // Événement hier à 08:15
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const day = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  await page.locator('#moment-when').fill(`${day}T08:15`);
  await page.getByRole('button', { name: 'Aboyer', exact: true }).click();
  await expect(page.locator('tbody tr', { hasText: 'Aboyer' })).toContainText('08:15');

  // État : 13:00 → 14:30 hier = 1 h 30 min
  await page.getByLabel('État', { exact: true }).check();
  await page.locator('#moment-from').fill(`${day}T13:00`);
  await page.locator('#moment-to').fill(`${day}T14:30`);
  await page.getByRole('button', { name: 'Dormir', exact: true }).click();
  await expect(page.locator('tbody tr', { hasText: 'Dormir' })).toContainText('1 h 30 min');

  // Fin avant le début : refusé avec un message
  await page.locator('#moment-from').fill(`${day}T15:00`);
  await page.locator('#moment-to').fill(`${day}T14:00`);
  await page.getByRole('button', { name: 'Se reposer', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'La fin doit être après le début' })).toBeVisible();

  await removeAnimal(page, name);
});
