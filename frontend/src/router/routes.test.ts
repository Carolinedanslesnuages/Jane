import { describe, expect, it } from 'vitest';
import { routes } from './index';

describe('routes', () => {
  it('has a unique path and name for every page', () => {
    const paths = routes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
    const names = routes.flatMap((route) => ('name' in route && route.name ? [route.name] : []));
    expect(new Set(names).size).toBe(names.length);
  });

  it('labels the six pages of the navigation', () => {
    const labels = routes.flatMap((route) => ('meta' in route && route.meta?.label ? [route.meta.label] : []));
    expect(labels).toEqual(['Profils', 'Observation', 'Tests cognitifs', 'Tableau de bord', 'Données', 'À propos']);
  });
});
