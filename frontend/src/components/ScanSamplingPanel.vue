<template>
  <details class="scan">
    <summary>Échantillonnage par intervalle (scan)</summary>
    <div class="scan-body">
      <div>
        <label for="scan-interval">Intervalle</label>
        <select id="scan-interval" v-model.number="scan.intervalMinutes.value" :disabled="scan.active.value">
          <option v-for="minutes in INTERVALS" :key="minutes" :value="minutes">{{ minutes }} min</option>
        </select>
      </div>
      <div class="control">
        <button v-if="!scan.active.value" type="button" class="primary" @click="scan.start()">Démarrer le scan</button>
        <button v-else type="button" @click="scan.stop()">Arrêter le scan</button>
      </div>
      <div class="status" aria-live="polite">
        <template v-if="scan.active.value">
          <strong v-if="scan.due.value" class="due">Il est temps de scanner.</strong>
          <span v-else>Prochain scan dans {{ countdown }}</span>
          <button v-if="scan.due.value" type="button" @click="scan.acknowledge()">C'est noté</button>
          <span class="muted">{{ scan.scansDone.value }} scan(s) effectué(s)</span>
        </template>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useScanSampling } from '../composables/useScanSampling';

const INTERVALS = [2, 5, 10, 15, 30];

const scan = useScanSampling();

const countdown = computed(() => {
  const seconds = scan.remainingSeconds.value ?? 0;
  return `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`;
});
</script>

<style scoped>
.scan {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-5);
  margin-bottom: var(--space-4);
}

summary {
  cursor: pointer;
  font-weight: 600;
}

.scan-body {
  display: grid;
  grid-template-columns: 10rem auto 1fr;
  gap: var(--space-4);
  align-items: end;
  margin-top: var(--space-3);
}

.status {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.due {
  color: var(--color-danger);
}
</style>
