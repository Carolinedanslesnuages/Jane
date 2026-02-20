<template>
  <aside class="sidebar">
    <header class="brand">
      <span class="brand-name">Jane</span>
      <span class="brand-tagline">Carnet d'observation du comportement canin</span>
    </header>
    <nav aria-label="Navigation principale">
      <RouterLink v-for="route in navigation" :key="route.path" :to="route.path" class="nav-link">
        {{ route.meta?.label }}
      </RouterLink>
    </nav>
    <footer class="account">
      <span class="account-name">{{ session.label }}</span>
      <button type="button" @click="session.signOut()">Se déconnecter</button>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { routes } from '../router';
import { useSessionStore } from '../stores/session';

const session = useSessionStore();
onMounted(() => session.load());

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
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.brand-name {
  display: block;
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.1;
}

.brand-tagline {
  display: block;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.account {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
}

.account-name {
  font-size: 0.9rem;
  color: var(--color-muted);
  overflow-wrap: anywhere;
}

nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-link {
  display: block;
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius);
  color: var(--color-ink);
  text-decoration: none;
}

.nav-link:hover {
  background: var(--color-sand-dark);
}

.nav-link.router-link-active {
  background: var(--color-forest);
  color: var(--color-cream);
}
</style>
