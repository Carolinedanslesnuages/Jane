import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from './version';

describe('APP_VERSION', () => {
  it('matches the version of package.json', () => {
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(APP_VERSION).toBe(version);
  });
});
