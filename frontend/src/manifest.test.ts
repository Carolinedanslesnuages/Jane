import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('web app manifest', () => {
  const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));

  it('describes an installable standalone app', () => {
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.short_name).toBe('Jane');
  });

  it('points to icons that exist', () => {
    for (const icon of manifest.icons) {
      expect(existsSync(`public${icon.src}`)).toBe(true);
    }
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('uses the colours of the theme', () => {
    expect(manifest.theme_color).toBe('#2f5d50');
    expect(manifest.background_color).toBe('#fbf8f1');
  });
});
