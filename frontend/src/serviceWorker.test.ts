import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const worker = readFileSync('public/sw.js', 'utf8');

describe('service worker', () => {
  it('never caches other origins (the API and Keycloak)', () => {
    expect(worker).toContain('url.origin !== self.location.origin');
  });

  it("only caches GET requests", () => {
    expect(worker).toContain("request.method !== 'GET'");
  });

  it('falls back to the cached page when the network is down', () => {
    expect(worker).toContain("caches.match('/')");
  });

  it('removes the caches of previous versions', () => {
    expect(worker).toContain('caches.delete(name)');
  });
});
