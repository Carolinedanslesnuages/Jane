import { describe, expect, it } from 'vitest';
import { samplingLabel, SAMPLING_METHODS } from './sampling';

describe('sampling methods', () => {
  it('lists the three methods of the API', () => {
    expect(SAMPLING_METHODS.map((entry) => entry.value)).toEqual(['AD_LIBITUM', 'FOCAL', 'SCAN']);
  });

  it('labels them in French', () => {
    expect(samplingLabel('AD_LIBITUM')).toBe('Libre');
    expect(samplingLabel('FOCAL')).toBe('Focal');
  });
});
