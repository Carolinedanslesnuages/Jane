<template>
  <section>
    <PageHeader title="Tests cognitifs" subtitle="Chronométrez et comparez les épreuves de résolution de problème." />

    <AppCard v-if="animalsStore.loaded && !animalsStore.selectedAnimal">
      <p>Ajoutez d'abord un chien dans la page <RouterLink to="/profils">Profils</RouterLink> pour enregistrer des tests.</p>
    </AppCard>

    <template v-else-if="animalsStore.selectedAnimal">
      <AppCard>
        <label for="test-type">Épreuve pour {{ animalsStore.selectedAnimal.name }}</label>
        <select id="test-type" v-model="testType">
          <option v-for="test in COGNITIVE_TESTS" :key="test.type" :value="test.type">{{ test.label }}</option>
        </select>
        <p class="muted description">{{ currentTest.description }}</p>
      </AppCard>

      <AppCard title="Chronomètre">
        <div class="stopwatch">
          <output class="reading" aria-live="off">{{ stopwatch.elapsedSeconds.value.toFixed(1) }} s</output>
          <button v-if="!stopwatch.running.value" type="button" class="primary" @click="startStopwatch">Démarrer</button>
          <button v-else type="button" class="primary" @click="stopStopwatch">Arrêter</button>
          <button type="button" @click="resetStopwatch">Réinitialiser</button>
        </div>
      </AppCard>

      <AppCard title="Résultat">
        <form class="result-form" @submit.prevent="saveResult">
          <div>
            <label for="result-duration">Durée (secondes)</label>
            <input id="result-duration" v-model.number="measuredSeconds" type="number" min="0.1" step="0.1" required />
          </div>
          <div>
            <label class="inline"><input v-model="withScore" type="checkbox" /> Renseigner un score</label>
            <input v-model.number="score" type="number" min="0" max="10" step="0.5" :disabled="!withScore" aria-label="Score sur 10" />
          </div>
          <div class="notes">
            <label for="result-notes">Notes</label>
            <textarea id="result-notes" v-model="notes" rows="2" maxlength="500"></textarea>
          </div>
          <div class="actions">
            <button type="submit" class="primary" :disabled="saving || !(measuredSeconds > 0)">Enregistrer le test</button>
          </div>
        </form>
      </AppCard>

      <h2>Historique de {{ animalsStore.selectedAnimal.name }}</h2>
      <p v-if="cognitiveStore.tests.length === 0" class="muted">Aucun test enregistré pour ce chien.</p>
      <template v-else>
        <div class="metrics">
          <AppCard>
            <span class="metric-label">Tests réalisés</span>
            <strong class="metric-value">{{ cognitiveStore.tests.length }}</strong>
          </AppCard>
          <AppCard>
            <span class="metric-label">Durée moyenne</span>
            <strong class="metric-value">{{ formatDuration(averageDuration) }}</strong>
          </AppCard>
          <AppCard>
            <span class="metric-label">Score moyen</span>
            <strong class="metric-value">{{ averageScore === null ? 'Non renseigné' : `${averageScore.toFixed(1)} / 10` }}</strong>
          </AppCard>
        </div>

        <AppCard v-if="chartData.datasets.length > 0 && cognitiveStore.tests.length > 1">
          <div class="chart"><Line :data="chartData" :options="chartOptions" /></div>
        </AppCard>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Date</th><th>Épreuve</th><th>Durée</th><th>Score</th><th>Notes</th></tr>
            </thead>
            <tbody>
              <tr v-for="test in cognitiveStore.tests" :key="test.id">
                <td>{{ formatDateTime(test.recordedAt) }}</td>
                <td>{{ cognitiveLabel(test.testType) }}</td>
                <td>{{ formatDuration(test.durationSeconds) }}</td>
                <td>{{ test.score ?? '–' }}</td>
                <td>{{ test.notes || '–' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Line } from 'vue-chartjs';
import AppCard from '../components/AppCard.vue';
import PageHeader from '../components/PageHeader.vue';
import { useStopwatch } from '../composables/useStopwatch';
import { useCognitiveStore } from '../stores/cognitive';
import { useAnimalsStore } from '../stores/animals';
import { useToastsStore } from '../stores/toasts';
import { ACCENT_HEX } from '../charts/setup';
import { cognitiveLabel, COGNITIVE_TESTS } from '../utils/cognitive';
import { formatDateTime, formatDuration } from '../utils/format';
import type { CognitiveTestType } from '../api/types';

const animalsStore = useAnimalsStore();
const cognitiveStore = useCognitiveStore();
const toasts = useToastsStore();
const stopwatch = useStopwatch();

const testType = ref<CognitiveTestType>('OBJECT_PERMANENCE');
const currentTest = computed(() => COGNITIVE_TESTS.find((test) => test.type === testType.value) ?? COGNITIVE_TESTS[0]);

/** The last measured duration, offered to the result form. */
const measuredSeconds = ref(0);

const withScore = ref(false);
const score = ref(5);
const notes = ref('');
const saving = ref(false);

async function saveResult() {
  const animal = animalsStore.selectedAnimal;
  if (!animal) {
    return;
  }
  saving.value = true;
  try {
    await cognitiveStore.record(animal.id, {
      testType: testType.value,
      durationSeconds: measuredSeconds.value,
      score: withScore.value ? score.value : undefined,
      notes: notes.value.trim() || undefined,
    });
    toasts.info(`${currentTest.value.label} enregistré pour ${animal.name}.`);
    resetStopwatch();
    notes.value = '';
    withScore.value = false;
  } catch (error) {
    toasts.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

function startStopwatch() {
  stopwatch.start();
}

function stopStopwatch() {
  measuredSeconds.value = stopwatch.stop();
}

function resetStopwatch() {
  stopwatch.reset();
  measuredSeconds.value = 0;
}

const averageDuration = computed(
  () => cognitiveStore.tests.reduce((sum, test) => sum + test.durationSeconds, 0) / Math.max(1, cognitiveStore.tests.length),
);

const averageScore = computed(() => {
  const scores = cognitiveStore.tests.map((test) => test.score).filter((value): value is number => value !== null);
  return scores.length > 0 ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
});

const TEST_COLORS = [ACCENT_HEX, '#d9923b', '#8272a8'];

/** One line per test type: duration over time, oldest first. */
const chartData = computed(() => {
  const ordered = [...cognitiveStore.tests].reverse();
  const labels = ordered.map((test) => formatDateTime(test.recordedAt));
  return {
    labels,
    datasets: COGNITIVE_TESTS.map((test, index) => ({
      label: test.label,
      borderColor: TEST_COLORS[index],
      backgroundColor: TEST_COLORS[index],
      tension: 0.25,
      spanGaps: true,
      data: ordered.map((entry) => (entry.testType === test.type ? entry.durationSeconds : null)),
    })).filter((dataset) => dataset.data.some((value) => value !== null)),
  };
});

const chartOptions = {
  plugins: { title: { display: true, text: 'Évolution des durées (secondes)' } },
};

onMounted(() => animalsStore.load());

watch(
  () => animalsStore.selectedAnimal?.id,
  (animalId) => animalId && cognitiveStore.load(animalId),
  { immediate: true },
);
</script>

<style scoped>
.description {
  margin: var(--space-2) 0 0;
}

.stopwatch {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.result-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: var(--space-4);
  align-items: start;
}

.notes {
  grid-column: 1 / -1;
}

.actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
}

label.inline {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-ink);
  font-size: 1rem;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-4);
}

.metric-label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.metric-value {
  font-family: var(--font-heading);
  font-size: 1.6rem;
}

.chart {
  height: 18rem;
}

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
}

th {
  font-size: 0.8rem;
  color: var(--color-muted);
  background: var(--color-sand);
}

.reading {
  min-width: 8rem;
  font-family: var(--font-heading);
  font-size: 2.25rem;
  font-variant-numeric: tabular-nums;
}
</style>
