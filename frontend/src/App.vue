<template>
  <nav>
    <RouterLink v-for="route in navigation" :key="route.path" :to="route.path">
      {{ route.meta?.label }}
    </RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { routes } from './router';

const navigation = routes.filter((route) => route.meta?.label);
</script>
