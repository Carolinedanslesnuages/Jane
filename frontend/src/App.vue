<template>
  <OfflineBanner />
  <div class="shell">
    <AppSidebar @sync="syncNow" />
    <main class="content">
      <div class="content-inner">
        <RouterView />
      </div>
    </main>
    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './components/AppSidebar.vue';
import { useAutoSync } from './composables/useAutoSync';
import OfflineBanner from './components/OfflineBanner.vue';
import ToastHost from './components/ToastHost.vue';

const { syncNow } = useAutoSync();
</script>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

.content {
  flex: 1;
  min-width: 0;
  padding: var(--space-6) var(--space-5) 4rem;
}

@media (max-width: 800px) {
  .shell {
    flex-direction: column;
  }

  .content {
    padding: var(--space-5) var(--space-4) 3rem;
  }
}

.content-inner {
  max-width: var(--content-width);
  margin: 0 auto;
}
</style>
