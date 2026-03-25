import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '../api/client';
import type { Profile } from '../api/types';
import { currentSubject, isOfflineSession, signOut } from '../auth/keycloak';
import { loadWithCache } from '../offline/cache';

export const useSessionStore = defineStore('session', () => {
  const profile = ref<Profile | null>(null);

  /** What to show for the signed-in person: their name, else their email. */
  const label = computed(() => profile.value?.displayName || profile.value?.email || '');

  async function load() {
    const { value } = await loadWithCache(`profile:${currentSubject() ?? 'anonymous'}`, () => api.get<Profile>('/me'));
    profile.value = value;
  }

  /** Deletes the account and all its data, then ends the session. Irreversible. */
  async function deleteAccount() {
    await api.delete<{ identityDeleted: boolean }>('/me');
    await signOut();
  }

  /** Signing out needs the identity server: it is not possible in an offline session. */
  const canSignOut = !isOfflineSession();

  return { profile, label, load, signOut, deleteAccount, canSignOut };
});
