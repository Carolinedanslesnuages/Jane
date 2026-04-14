import { describe, expect, it } from 'vitest';
import { describeChart } from './describe';

describe('describeChart', () => {
  it('carries the values of a single series', () => {
    const chart = { labels: ['Stress', 'Jeu'], datasets: [{ data: [2, 1] }] };
    expect(describeChart('Événements par catégorie', chart)).toBe('Événements par catégorie : Stress 2, Jeu 1.');
  });

  it('describes each series of a stacked chart and skips empty days', () => {
    const chart = {
      labels: ['19/02', '20/02'],
      datasets: [
        { label: 'Jeu', data: [0, 3] },
        { label: 'Repos', data: [1, 0] },
      ],
    };
    expect(describeChart('Observations par jour', chart)).toBe('Observations par jour. Jeu : 20/02 3 ; Repos : 19/02 1.');
  });

  it('says so when there is nothing to describe', () => {
    expect(describeChart('Stress', null)).toBe('Stress : aucune donnée.');
    expect(describeChart('Stress', { labels: [], datasets: [] })).toBe('Stress : aucune donnée.');
  });

  it('treats a missing value as zero', () => {
    expect(describeChart('Durées', { labels: ['a'], datasets: [{ data: [null] }] })).toBe('Durées : a 0.');
  });
});
