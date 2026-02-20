import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CATEGORY_HEX } from './setup';

describe('chart colours', () => {
  it('match the colours declared in the stylesheet', () => {
    const tokens = readFileSync('src/styles/tokens.css', 'utf8');
    for (const [category, hex] of Object.entries(CATEGORY_HEX)) {
      expect(tokens).toContain(`--category-${category.toLowerCase()}: ${hex};`);
    }
  });
});
