import type { AccessRole, Animal } from '../api/types';

export const ROLE_LABELS: Record<AccessRole, string> = {
  OWNER: 'Propriétaire',
  OBSERVER: 'Observateur',
  VIEWER: 'Lecteur',
};

/** Whether the person may record observations, sessions and tests for the animal. */
export function canRecord(animal: Pick<Animal, 'role'> | null | undefined): boolean {
  return animal?.role === 'OWNER' || animal?.role === 'OBSERVER';
}

/** Whether the person may edit, delete or share the animal. */
export function isOwner(animal: Pick<Animal, 'role'> | null | undefined): boolean {
  return animal?.role === 'OWNER';
}
