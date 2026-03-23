import { onScopeDispose, watch } from 'vue';
import { useAnimalsStore } from '../stores/animals';
import { useConnectivityStore } from '../stores/connectivity';
import { useObservationsStore } from '../stores/observations';
import { useOutboxStore } from '../stores/outbox';
import { useToastsStore } from '../stores/toasts';

const RETRY_INTERVAL_MS = 30_000;

/**
 * Sends what was noted offline as soon as the network is back, and retries every 30 seconds while something waits
 * (the browser says "online" on a Wi-Fi without internet, so the event alone is not enough).
 */
export function useAutoSync() {
  const connectivity = useConnectivityStore();
  const outbox = useOutboxStore();
  const toasts = useToastsStore();
  const observations = useObservationsStore();
  const animals = useAnimalsStore();

  /** Sends what waits, whatever the connectivity flag says (used by the timer and by the "send now" button). */
  async function syncNow() {
    if (outbox.pending === 0) {
      return;
    }
    const result = await outbox.flush();
    if (result.sent > 0) {
      toasts.info(result.sent === 1 ? '1 saisie envoyée.' : `${result.sent} saisies envoyées.`);
      if (animals.selectedAnimal) {
        await observations.refresh(animals.selectedAnimal.id);
      }
    }
    if (result.rejected.length > 0) {
      toasts.error(`${result.rejected.length} saisie(s) refusée(s) par le serveur : voir la barre latérale.`);
    }
  }

  outbox.refreshCount();
  // At startup, only try if the browser believes it has network; the timer below tries anyway.
  if (connectivity.online) {
    syncNow();
  }

  watch(
    () => connectivity.online,
    (online) => {
      if (online) {
        syncNow();
      }
    },
  );

  const timer = setInterval(syncNow, RETRY_INTERVAL_MS);
  onScopeDispose(() => clearInterval(timer));

  return { syncNow };
}
