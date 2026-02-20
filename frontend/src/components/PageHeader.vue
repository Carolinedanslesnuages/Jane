<template>
  <header class="page-header">
    <h1>{{ title }}</h1>
    <p v-if="subtitle" class="muted">{{ subtitle }}</p>
  </header>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<style scoped>
.page-header {
  margin-bottom: var(--space-5);
}
</style>
