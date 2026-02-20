<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Comportement</th>
          <th>Catégorie</th>
          <th>Type</th>
          <th>Durée</th>
          <th>Lieu</th>
          <th v-if="removable"><span class="visually-hidden">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="observation in observations" :key="observation.id">
          <td>{{ formatDateTime(observation.recordedAt) }}</td>
          <td>{{ observation.behavior }}</td>
          <td>
            <span class="dot" :style="{ background: categoryColor(observation.category) }" aria-hidden="true"></span>
            {{ ethogramStore.labelOf(observation.category) }}
          </td>
          <td>{{ observation.type === 'EVENT' ? 'Événement' : 'État' }}</td>
          <td class="numeric">{{ formatDuration(observation.durationSeconds) || '–' }}</td>
          <td>{{ observation.location || '–' }}</td>
          <td v-if="removable" class="actions">
            <ConfirmAction label="Supprimer" message="Supprimer cette observation ?" @confirm="emit('remove', observation)" />
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="observations.length === 0" class="muted empty">Aucune observation pour le moment.</p>
  </div>
</template>

<script setup lang="ts">
import type { Observation } from '../api/types';
import { useEthogramStore } from '../stores/ethogram';
import { categoryColor } from '../utils/categories';
import { formatDateTime, formatDuration } from '../utils/format';
import ConfirmAction from './ConfirmAction.vue';

defineProps<{ observations: Observation[]; removable?: boolean }>();
const emit = defineEmits<{ remove: [observation: Observation] }>();

const ethogramStore = useEthogramStore();
</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-sand);
  white-space: nowrap;
}

th {
  font-size: 0.8rem;
  color: var(--color-muted);
  background: var(--color-sand);
  font-weight: 600;
}

.numeric {
  font-variant-numeric: tabular-nums;
}

.dot {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  margin-right: var(--space-1);
}

.empty {
  padding: var(--space-4);
  margin: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
