<template>
  <section class="card">
    <h2 v-if="title" class="card-title">{{ title }}</h2>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>();
</script>

<style scoped>
.card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-4);
}

.card-title {
  font-size: 1.15rem;
  margin: 0 0 var(--space-3);
}
</style>
