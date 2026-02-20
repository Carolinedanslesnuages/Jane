<template>
  <AppCard v-if="states.length > 0" class="active-states">
    <h2 class="title">En cours ({{ states.length }})</h2>
    <ul>
      <li v-for="state in states" :key="state.id">
        <span class="dot" :style="{ background: categoryColor(state.category) }" aria-hidden="true"></span>
        <span class="behavior">{{ state.behavior }}</span>
        <span class="elapsed">{{ elapsed(state.startedAt) }}</span>
      </li>
    </ul>
  </AppCard>
</template>

<script setup lang="ts">
import type { ActiveState } from '../api/types';
import { useNow } from '../composables/useNow';
import { categoryColor } from '../utils/categories';
import { formatDuration } from '../utils/format';
import AppCard from './AppCard.vue';

defineProps<{ states: ActiveState[] }>();

const now = useNow(1000);

function elapsed(startedAt: string): string {
  return formatDuration(Math.max(0, (now.value - new Date(startedAt).getTime()) / 1000));
}
</script>

<style scoped>
.title {
  font-size: 1rem;
  margin: 0 0 var(--space-2);
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
}

.behavior {
  flex: 1;
}

.elapsed {
  font-variant-numeric: tabular-nums;
  color: var(--color-muted);
}
</style>
