<template>
  <p v-if="animal" class="banner">
    <strong class="name">{{ animal.name }}</strong>
    <span class="detail">{{ details }}</span>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Animal } from '../api/types';
import { formatAge } from '../utils/format';
import { speciesLabel } from '../utils/species';

const props = defineProps<{ animal: Animal | null }>();

const details = computed(() => {
  if (!props.animal) {
    return '';
  }
  const parts = [speciesLabel(props.animal.species)];
  if (props.animal.birthDate) {
    parts.push(formatAge(props.animal.birthDate));
  }
  return parts.join(' · ');
});
</script>

<style scoped>
.banner {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-3);
  margin: 0 0 var(--space-4);
  padding: 0.35rem 0.9rem;
  background: var(--color-sand);
  border: 1px solid var(--color-border);
  border-radius: 999px;
}

.name {
  font-family: var(--font-heading);
  font-size: 1.1rem;
}

.detail {
  color: var(--color-muted);
  font-size: 0.9rem;
}
</style>
