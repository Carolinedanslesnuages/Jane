import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '../api/client';
import type { Profile } from '../api/types';
import { signOut } from '../auth/keycloak';

export const useSessionStore = defineStore('session', () => {
  const profile = ref<Profile | null>(null);

  /** What to show for the signed-in person: their name, else their email. */
  const label = computed(() => profile.value?.displayName || profile.value?.email || '');

  async function load() {
    profile.value = await api.get<Profile>('/me');
  }

  /** Deletes the account and all its data, then ends the session. Irreversible. */
  async function deleteAccount() {
    await api.delete<{ identityDeleted: boolean }>('/me');
    await signOut();
  }

  return { profile, label, load, signOut, deleteAccount };
});
