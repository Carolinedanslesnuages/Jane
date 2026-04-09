import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import type { Share, ShareRole } from '../api/types';

export const useSharesStore = defineStore('shares', () => {
  const shares = ref<Share[]>([]);

  /** Who an animal is shared with (owner only). */
  async function load(animalId: string) {
    shares.value = await api.get<Share[]>(`/animals/${animalId}/shares`);
  }

  async function share(animalId: string, email: string, role: ShareRole) {
    await api.post(`/animals/${animalId}/shares`, { email, role });
    await load(animalId);
  }

  async function remove(animalId: string, shareId: string) {
    await api.delete(`/animals/${animalId}/shares/${shareId}`);
    await load(animalId);
  }

  /** Leaves an animal that was shared with the person (no reload: the caller reloads the animals). */
  async function leave(animalId: string, shareId: string) {
    await api.delete(`/animals/${animalId}/shares/${shareId}`);
  }

  return { shares, load, share, remove, leave };
});
