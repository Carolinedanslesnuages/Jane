import { describe, expect, it } from 'vitest';
import { canRecord, isOwner, ROLE_LABELS } from './access';

describe('access roles', () => {
  it('lets the owner and observers record, but not viewers', () => {
    expect(canRecord({ role: 'OWNER' })).toBe(true);
    expect(canRecord({ role: 'OBSERVER' })).toBe(true);
    expect(canRecord({ role: 'VIEWER' })).toBe(false);
    expect(canRecord(null)).toBe(false);
  });

  it('keeps editing and sharing for the owner', () => {
    expect(isOwner({ role: 'OWNER' })).toBe(true);
    expect(isOwner({ role: 'OBSERVER' })).toBe(false);
    expect(isOwner(undefined)).toBe(false);
  });

  it('labels the roles in French', () => {
    expect(ROLE_LABELS.VIEWER).toBe('Lecteur');
    expect(ROLE_LABELS.OBSERVER).toBe('Observateur');
  });
});
