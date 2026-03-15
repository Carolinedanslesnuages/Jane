import { expect, test } from '@playwright/test';

test("s'inscrit, supprime son compte et ne peut plus se connecter", async ({ page }) => {
  const email = `e2e-${Date.now().toString(36)}@jane.test`;
  const password = 'mot-de-passe-e2e-1';

  // Inscription depuis la page Keycloak
  await page.goto('/');
  await page.waitForURL(/\/realms\/jane\//);
  await page.getByRole('link', { name: /Enregistrement|Register/ }).click();
  await page.locator('#firstName').fill('Éphémère');
  await page.locator('#lastName').fill('Test');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#password-confirm').fill(password);
  await page.getByRole('button', { name: /Enregistrement|S'enregistrer|S'inscrire|Register/ }).click();
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();

  // Des données à supprimer
  await page.getByLabel('Nom *').first().fill('À supprimer');
  await page.getByRole('button', { name: 'Ajouter' }).click();
  await expect(page.locator('article', { hasText: 'À supprimer' })).toBeVisible();

  // Page Mon compte : la suppression est verrouillée tant que le mot n'est pas saisi
  await page.getByRole('link', { name: 'Mon compte', exact: true }).click();
  await expect(page.getByText(email)).toBeVisible();
  const deleteButton = page.getByRole('button', { name: 'Supprimer définitivement mon compte' });
  await expect(deleteButton).toBeDisabled();
  await page.locator('#delete-confirmation').fill('SUPPRIMER');
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();

  // Déconnecté, et le compte n'existe plus
  await page.waitForURL(/\/realms\/jane\//);
  await page.goto('/');
  await page.waitForURL(/\/realms\/jane\//);
  await page.locator('#username').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#kc-login').click();
  await expect(page.getByText(/Invalid username or password|invalide/i)).toBeVisible();
});
