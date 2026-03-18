<template>
  <div v-if="!connectivity.online" class="offline-banner" role="status">
    <strong>Hors ligne.</strong>
    Vos observations sont conservées sur cet appareil et partiront dès que le réseau reviendra.
  </div>
</template>

<script setup lang="ts">
import { onMounted, onScopeDispose } from 'vue';
import { useConnectivityStore } from '../stores/connectivity';

const connectivity = useConnectivityStore();

onMounted(() => {
  const stop = connectivity.listen();
  onScopeDispose(stop);
});
</script>

<style scoped>
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
