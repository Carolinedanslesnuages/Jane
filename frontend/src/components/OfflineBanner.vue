<template>
  <div v-if="!connectivity.online" class="offline-banner" role="status">
    <strong>Hors ligne.</strong>
    Vos observations sont conservées sur cet appareil et partiront dès que le réseau reviendra.
    <template v-if="connectivity.offlineSession">
      Pour retrouver toutes vos données, reconnectez-vous une fois le réseau revenu.
    </template>
  </div>
  <div v-else-if="connectivity.offlineSession" class="offline-banner back" role="status">
    <strong>Le réseau est revenu.</strong>
    <button type="button" class="primary" @click="reconnect">Se reconnecter</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onScopeDispose, watch } from 'vue';
import { useConnectivityStore } from '../stores/connectivity';

const connectivity = useConnectivityStore();

/** Loads the page again: the sign-in then happens normally, and what waits on this device is kept. */
function reconnect() {
  window.location.reload();
}

// An application opened offline signs in again by itself as soon as the browser reports the network is back.
watch(
  () => connectivity.online,
  (online) => {
    if (online && connectivity.offlineSession) {
      reconnect();
    }
  },
);

onMounted(() => {
  const stop = connectivity.listen();
  onScopeDispose(stop);
});
</script>

<style scoped>
.offline-banner.back {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.offline-banner {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: var(--space-2) var(--space-4);
  background: var(--color-ink);
  color: var(--color-cream);
  font-size: 0.95rem;
}
</style>
