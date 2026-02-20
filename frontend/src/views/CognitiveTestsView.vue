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
import { COGNITIVE_TESTS } from '../utils/cognitive';
import type { CognitiveTestType } from '../api/types';

const dogsStore = useDogsStore();
const cognitiveStore = useCognitiveStore();
const stopwatch = useStopwatch();

const testType = ref<CognitiveTestType>('OBJECT_PERMANENCE');
const currentTest = computed(() => COGNITIVE_TESTS.find((test) => test.type === testType.value) ?? COGNITIVE_TESTS[0]);

/** The last measured duration, offered to the result form. */
const measuredSeconds = ref(0);

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

.reading {
  min-width: 8rem;
  font-family: var(--font-heading);
  font-size: 2.25rem;
  font-variant-numeric: tabular-nums;
}
</style>
