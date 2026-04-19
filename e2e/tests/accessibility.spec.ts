import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { signIn, uniqueName } from './helpers';

/** Audit automatique (axe-core, WCAG 2.1 A et AA) : aucune anomalie sérieuse ou critique sur aucune page. */
async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const blocking = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  const summary = blocking.map((violation) => `${violation.id} (${violation.impact}) : ${violation.nodes.length} élément(s), ex. ${violation.nodes[0].target.join(' ')}`);
  expect(summary, `${label} : anomalies d'accessibilité`).toEqual([]);
}

test("aucune anomalie d'accessibilité sérieuse sur les pages de Jane", async ({ page }) => {
  const name = uniqueName('Accessible');
  await signIn(page);
  await page.getByLabel('Nom *').first().fill(name);
  await page.getByRole('button', { name: 'Ajouter' }).click();
  await expect(page.locator('article', { hasText: name })).toBeVisible();
  try {
    await page.locator('#animal-picker').selectOption({ label: `${name} · Chien` });

    await audit(page, 'Profils');
    for (const label of ['Observation', 'Tests cognitifs', 'Tableau de bord', 'Données', 'Mon compte', 'À propos']) {
      await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: label, exact: true }).click();
      await page.waitForLoadState('networkidle');
      await audit(page, label);
    }

    // Une page avec des données : le tableau de bord et les tableaux
    await page.getByRole('link', { name: 'Observation', exact: true }).click();
    await page.getByRole('button', { name: 'Aboyer', exact: true }).click();
    await expect(page.locator('tbody tr', { hasText: 'Aboyer' })).toBeVisible();
    await audit(page, 'Observation avec données');
    await page.getByRole('link', { name: 'Tableau de bord', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await audit(page, 'Tableau de bord avec données');
  } finally {
    // L'animal de test est supprimé même si un contrôle d'accessibilité échoue.
    await page.getByRole('link', { name: 'Profils', exact: true }).click();
    const card = page.locator('article', { hasText: name });
    await card.getByRole('button', { name: 'Supprimer' }).click();
    await card.getByRole('button', { name: 'Confirmer' }).click();
    await expect(page.locator('article', { hasText: name })).toHaveCount(0);
  }
});
