import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiSend } from '../api/client';
import { NetworkError, Outbox, RejectedError, type FlushResult, type OutboxEntry } from '../offline/outbox';
import { recallUser, rememberUser } from '../offline/user';
import { useConnectivityStore } from './connectivity';
import { useSessionStore } from './session';

export const useOutboxStore = defineStore('outbox', () => {
  const outbox = new Outbox(localStorage);
  const connectivity = useConnectivityStore();
  const session = useSessionStore();

  const pending = ref(0);
  const rejected = ref<FlushResult['rejected']>([]);
  const flushing = ref(false);

  /** The account whose entries are handled: the signed-in one, or the last one seen when offline at startup. */
  function currentUserId(): string | null {
    if (session.profile) {
      rememberUser(session.profile.id);
      return session.profile.id;
    }
    return recallUser();
  }

  function refreshCount() {
    const userId = currentUserId();
    pending.value = userId ? outbox.list(userId).length : 0;
  }

  function entries(): OutboxEntry[] {
    const userId = currentUserId();
    return userId ? outbox.list(userId) : [];
  }

  /**
   * Sends a POST now when the network allows it, otherwise keeps it for later.
   * `queuedBody` is what to send if it has to wait: it carries the moment of the observation.
   * Returns "sent" or "queued"; a request the server refuses throws.
   */
  async function submit(path: string, body: unknown, label: string, queuedBody: unknown = body): Promise<'sent' | 'queued'> {
    const userId = currentUserId();
    if (connectivity.online) {
      try {
        await apiSend(path, body);
        return 'sent';
      } catch (error) {
        if (!(error instanceof NetworkError)) {
          throw error;
        }
        connectivity.setOnline(false);
      }
    }
    if (!userId) {
      throw new Error('Impossible de conserver la saisie : aucun compte connu sur cet appareil.');
    }
    outbox.add({ userId, label, path, body: queuedBody });
    refreshCount();
    return 'queued';
  }

  /** Sends what is waiting. Safe to call at any time: one flush runs at once. */
  async function flush(): Promise<FlushResult> {
    const empty: FlushResult = { sent: 0, rejected: [], interrupted: false };
    const userId = currentUserId();
    if (!userId || flushing.value) {
      return empty;
    }
    flushing.value = true;
    try {
      const result = await outbox.flush(userId, (entry) => apiSend(entry.path, entry.body));
      if (result.interrupted) {
        connectivity.setOnline(false);
      } else if (result.sent > 0 || result.rejected.length > 0) {
        connectivity.setOnline(true);
      }
      rejected.value = [...rejected.value, ...result.rejected];
      return result;
    } finally {
      flushing.value = false;
      refreshCount();
    }
  }

  function dismissRejected() {
    rejected.value = [];
  }

  return { pending, rejected, flushing, entries, refreshCount, submit, flush, dismissRejected };
});

export { NetworkError, RejectedError };
