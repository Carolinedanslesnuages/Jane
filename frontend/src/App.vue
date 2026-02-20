<template>
  <div class="shell">
    <AppSidebar />
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
import ToastHost from './components/ToastHost.vue';
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

.content-inner {
  max-width: var(--content-width);
  margin: 0 auto;
}
</style>
