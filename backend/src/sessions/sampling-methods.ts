import { SamplingMethod } from '@prisma/client';

/** The French name of each sampling method, as shown in exports. */
export const SAMPLING_METHOD_LABELS: Record<SamplingMethod, string> = {
  AD_LIBITUM: 'Libre',
  FOCAL: 'Focal',
  SCAN: 'Scan',
};
