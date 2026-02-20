<template>
  <section>
    <PageHeader title="Données" subtitle="Exports et liste complète des observations." />

    <AppCard v-if="dogsStore.loaded && !dogsStore.selectedDog">
      <p>Ajoutez d'abord un chien dans la page <RouterLink to="/profils">Profils</RouterLink>.</p>
    </AppCard>

    <template v-else-if="dogsStore.selectedDog">
      <h2>Observations de {{ dogsStore.selectedDog.name }}</h2>
      <p class="muted">
        {{ observationsStore.historyTotal }} observation(s)
        <template v-if="observationsStore.historyTotal > observationsStore.history.length">
          · les {{ observationsStore.history.length }} plus récentes sont affichées
        </template>
      </p>
      <ObservationsTable :observations="observationsStore.history" removable @remove="removeObservation" />
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import type { Observation } from '../api/types';
import AppCard from '../components/AppCard.vue';
import ObservationsTable from '../components/ObservationsTable.vue';
import PageHeader from '../components/PageHeader.vue';
import { useDogsStore } from '../stores/dogs';
import { useEthogramStore } from '../stores/ethogram';
import { useObservationsStore } from '../stores/observations';
import { useToastsStore } from '../stores/toasts';

const dogsStore = useDogsStore();
const ethogramStore = useEthogramStore();
const observationsStore = useObservationsStore();
const toasts = useToastsStore();

async function removeObservation(observation: Observation) {
  try {
    await observationsStore.removeObservation(observation.dogId, observation.id);
    toasts.info('Observation supprimée.');
  } catch (error) {
    toasts.error((error as Error).message);
  }
}

onMounted(() => Promise.all([dogsStore.load(), ethogramStore.load()]));

watch(
  () => dogsStore.selectedDog?.id,
  (dogId) => (dogId ? observationsStore.loadHistory(dogId) : observationsStore.reset()),
  { immediate: true },
);
</script>
