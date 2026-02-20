<template>
  <aside class="sidebar">
    <nav aria-label="Navigation principale">
      <RouterLink v-for="route in navigation" :key="route.path" :to="route.path" class="nav-link">
        {{ route.meta?.label }}
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { routes } from '../router';

const navigation = routes.filter((route) => route.meta?.label);
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  background: var(--color-sand);
  border-right: 1px solid var(--color-border);
  padding: var(--space-5) var(--space-4);
  min-height: 100vh;
}

nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
</style>
