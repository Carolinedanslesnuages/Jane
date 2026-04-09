import { expect, test } from '@playwright/test';
import { signIn, uniqueName } from './helpers';

/** Inscrit une nouvelle personne dans Keycloak et ouvre Jane avec son compte. */
async function registerAndOpen(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/');
  await page.waitForURL(/\/realms\/jane\//);
  await page.getByRole('link', { name: /Enregistrement|Register/ }).click();
  await page.locator('#firstName').fill('Paul');
  await page.locator('#lastName').fill('Partage');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#password-confirm').fill(password);
  await page.getByRole('button', { name: /Enregistrement|S'enregistrer|S'inscrire|Register/ }).click();
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
}

test('partage un animal avec une autre personne : lecteur, puis observateur, puis retrait', async ({ browser, page: ownerPage }) => {
  const animal = uniqueName('Partagé');
  const guestEmail = `invite-${Date.now().toString(36)}@jane.test`;
  const guestContext = await browser.newContext({
    baseURL: process.env.JANE_WEB_URL ?? 'http://localhost:5273',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    viewport: { width: 1280, height: 800 },
  });
  const guest = await guestContext.newPage();

  // La personne invitée existe (elle s'est connectée une fois)
  await registerAndOpen(guest, guestEmail, 'mot-de-passe-invite-1');

  // La propriétaire crée l'animal et le partage en lecture
  await signIn(ownerPage);
  await ownerPage.getByLabel('Nom *').first().fill(animal);
  await ownerPage.getByRole('button', { name: 'Ajouter' }).click();
  const ownerCard = ownerPage.locator('article', { hasText: animal });
  await expect(ownerCard).toBeVisible();
  await ownerCard.getByRole('button', { name: 'Partager' }).click();
  const shareForm = ownerCard.locator('.share-form');
  await shareForm.locator('input[type="email"]').fill(guestEmail);
  await shareForm.locator('select').selectOption('VIEWER');
  await shareForm.getByRole('button', { name: 'Partager', exact: true }).click();
  await expect(ownerCard.locator('.shares')).toContainText(guestEmail);
  await expect(ownerCard.locator('.shares select.role')).toHaveValue('VIEWER');

  // L'invitée voit l'animal en lecture seule
  await guest.reload();
  const guestCard = guest.locator('article', { hasText: animal });
  await expect(guestCard).toContainText('Partagé par');
  await expect(guestCard).toContainText('Lecteur');
  await expect(guestCard.getByRole('button', { name: 'Modifier' })).toHaveCount(0);
  await guest.locator('#animal-picker').selectOption({ label: `${animal} · Chien` });
  await guest.getByRole('link', { name: 'Observation', exact: true }).click();
  await expect(guest.getByText('en tant que lecteur')).toBeVisible();
  await expect(guest.getByRole('button', { name: 'Aboyer', exact: true })).toHaveCount(0);

  // La propriétaire passe l'invitée en observatrice : elle peut saisir
  await ownerCard.locator('.shares select.role').selectOption('OBSERVER');
  await expect(ownerCard.locator('.shares select.role')).toHaveValue('OBSERVER');
  await guest.reload();
  await expect(guest.getByRole('button', { name: 'Aboyer', exact: true })).toBeVisible();
  await guest.getByRole('button', { name: 'Aboyer', exact: true }).click();
  await expect(guest.locator('tbody tr', { hasText: 'Aboyer' })).toBeVisible();

  // La propriétaire voit la saisie de l'invitée
  await ownerPage.getByRole('link', { name: 'Observation', exact: true }).click();
  await ownerPage.locator('#animal-picker').selectOption({ label: `${animal} · Chien` });
  await expect(ownerPage.locator('tbody tr', { hasText: 'Aboyer' })).toBeVisible();

  // Retrait du partage : l'animal disparaît pour l'invitée
  await ownerPage.getByRole('link', { name: 'Profils', exact: true }).click();
  const again = ownerPage.locator('article', { hasText: animal });
  await again.getByRole('button', { name: 'Partager' }).click();
  await again.locator('.shares').getByRole('button', { name: 'Retirer' }).click();
  await again.locator('.shares').getByRole('button', { name: 'Confirmer' }).click();
  await expect(again.locator('.shares')).toHaveCount(0);
  await guest.getByRole('link', { name: 'Profils', exact: true }).click();
  await guest.reload();
  await expect(guest.locator('article', { hasText: animal })).toHaveCount(0);

  // Nettoyage : l'animal, puis le compte de l'invitée
  await again.getByRole('button', { name: 'Supprimer' }).click();
  await again.getByRole('button', { name: 'Confirmer' }).click();
  await guest.getByRole('link', { name: 'Mon compte', exact: true }).click();
  await guest.locator('#delete-confirmation').fill('SUPPRIMER');
  await guest.getByRole('button', { name: 'Supprimer définitivement mon compte' }).click();
  await guest.waitForURL(/\/realms\/jane\//);
  await guestContext.close();
});
