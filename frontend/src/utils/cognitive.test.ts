import { describe, expect, it } from 'vitest';
import { cognitiveLabel, COGNITIVE_TESTS } from './cognitive';

describe('cognitive tests catalogue', () => {
  it('describes the three tests of the API', () => {
    expect(COGNITIVE_TESTS.map((test) => test.type)).toEqual(['OBJECT_PERMANENCE', 'DETOUR', 'MANIPULATION']);
  });

  it('gives a French label', () => {
    expect(cognitiveLabel('DETOUR')).toBe('Test du détour');
  });
});
