<template>
  <div class="toast-host" aria-live="polite">
    <div v-for="toast in toastsStore.toasts" :key="toast.id" class="toast" :class="toast.kind" role="status">
      <span>{{ toast.message }}</span>
      <button type="button" class="close" aria-label="Fermer" @click="toastsStore.dismiss(toast.id)">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToastsStore } from '../stores/toasts';

const toastsStore = useToastsStore();
</script>

<style scoped>
.toast-host {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: 50;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-ink);
  color: var(--color-cream);
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-4);
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.2);
}

.toast.error {
  background: var(--color-danger);
}

.close {
  background: transparent;
  border: 0;
  color: inherit;
  padding: 0 var(--space-1);
  font-size: 1.2rem;
  line-height: 1;
}

.close:hover:not(:disabled) {
  background: transparent;
  opacity: 0.7;
}
</style>
