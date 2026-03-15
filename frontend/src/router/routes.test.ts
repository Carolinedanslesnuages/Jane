import { describe, expect, it } from 'vitest';
import { pageTitle, routes } from './index';

describe('routes', () => {
  it('has a unique path and name for every page', () => {
    const paths = routes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
    const names = routes.flatMap((route) => ('name' in route && route.name ? [route.name] : []));
    expect(new Set(names).size).toBe(names.length);
  });

  it('labels the pages of the navigation', () => {
    const labels = routes.flatMap((route) => ('meta' in route && route.meta?.label ? [route.meta.label] : []));
    expect(labels).toEqual(['Profils', 'Observation', 'Tests cognitifs', 'Tableau de bord', 'Données', 'Mon compte', 'À propos']);
  });

  it('catches unknown addresses with a dedicated page', () => {
    expect(routes.at(-1)?.path).toBe('/:pathMatch(.*)*');
  });

  it('builds the tab title from the page label', () => {
    expect(pageTitle({ label: 'Profils' })).toBe('Profils · Jane');
    expect(pageTitle({ title: 'Page introuvable' })).toBe('Page introuvable · Jane');
    expect(pageTitle({})).toContain('Jane');
  });
});
