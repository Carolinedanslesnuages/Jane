<template>
  <section>
    <PageHeader title="Tests cognitifs" subtitle="Chronométrez et comparez les épreuves de résolution de problème." />

    <AppCard v-if="dogsStore.loaded && !dogsStore.selectedDog">
      <p>Ajoutez d'abord un chien dans la page <RouterLink to="/profils">Profils</RouterLink> pour enregistrer des tests.</p>
    </AppCard>

    <template v-else-if="dogsStore.selectedDog">
      <AppCard>
        <label for="test-type">Épreuve pour {{ dogsStore.selectedDog.name }}</label>
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
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AppCard from '../components/AppCard.vue';
import PageHeader from '../components/PageHeader.vue';
import { useStopwatch } from '../composables/useStopwatch';
import { useCognitiveStore } from '../stores/cognitive';
import { useDogsStore } from '../stores/dogs';
import { useToastsStore } from '../stores/toasts';
import { COGNITIVE_TESTS } from '../utils/cognitive';
import type { CognitiveTestType } from '../api/types';

const dogsStore = useDogsStore();
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
  const dog = dogsStore.selectedDog;
  if (!dog) {
    return;
  }
  saving.value = true;
  try {
    await cognitiveStore.record(dog.id, {
      testType: testType.value,
      durationSeconds: measuredSeconds.value,
      score: withScore.value ? score.value : undefined,
      notes: notes.value.trim() || undefined,
    });
    toasts.info(`${currentTest.value.label} enregistré pour ${dog.name}.`);
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

onMounted(() => dogsStore.load());

watch(
  () => dogsStore.selectedDog?.id,
  (dogId) => dogId && cognitiveStore.load(dogId),
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

.reading {
  min-width: 8rem;
  font-family: var(--font-heading);
  font-size: 2.25rem;
  font-variant-numeric: tabular-nums;
}
</style>
