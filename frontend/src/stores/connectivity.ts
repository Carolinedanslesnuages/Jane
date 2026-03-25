import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Whether the API can be reached. The browser's own "online" flag is only a hint (a Wi-Fi without internet reports
 * "online"), so a failed request also marks the application offline, and a successful one marks it online again.
 */
export const useConnectivityStore = defineStore('connectivity', () => {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);

  /** True when the application was opened without network: it must reload to sign in once the network is back. */
  const offlineSession = ref(false);

  function setOnline(value: boolean) {
    online.value = value;
  }

  /** Listens to the browser's connectivity events; returns a function that stops listening. */
  function listen(target: Pick<Window, 'addEventListener' | 'removeEventListener'> = window): () => void {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    target.addEventListener('online', goOnline);
    target.addEventListener('offline', goOffline);
    return () => {
      target.removeEventListener('online', goOnline);
      target.removeEventListener('offline', goOffline);
    };
  }

  function startOfflineSession() {
    offlineSession.value = true;
    online.value = false;
  }

  return { online, offlineSession, setOnline, startOfflineSession, listen };
});
