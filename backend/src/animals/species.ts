import { Species } from '@prisma/client';

/** The French name of each species, as shown in exports and reports. */
export const SPECIES_LABELS: Record<Species, string> = {
  DOG: 'Chien',
  CAT: 'Chat',
  HORSE: 'Cheval',
  OTHER: 'Autre espèce',
};
