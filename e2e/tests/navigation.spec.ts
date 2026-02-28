import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

test('se connecte avec Keycloak et affiche les six pages', async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Profils' })).toBeVisible();

  const pages = ['Observation', 'Tests cognitifs', 'Tableau de bord', 'Données', 'À propos', 'Profils'];
  for (const name of pages) {
    await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(`${name === 'Profils' ? 'Profils' : name} · Jane`));
  }
});

test('affiche le compte connecté et permet de se déconnecter', async ({ page }) => {
  await signIn(page);
  await expect(page.getByText('demo@jane.test').or(page.getByText('Démo Jane'))).toBeVisible();
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await page.waitForURL(/\/realms\/jane\//);
});
