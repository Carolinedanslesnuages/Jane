<template>
  <section>
    <PageHeader title="Données" subtitle="Exports et liste complète des observations." />

    <AppCard v-if="dogsStore.loaded && !dogsStore.selectedDog">
      <p>Ajoutez d'abord un chien dans la page <RouterLink to="/profils">Profils</RouterLink>.</p>
    </AppCard>

    <template v-else-if="dogsStore.selectedDog">
      <AppCard title="Exports">
        <p class="muted">
          Le CSV se lit avec R, Excel ou tout autre outil d'analyse. Le rapport PDF résume les 30 derniers jours de
          {{ dogsStore.selectedDog.name }}.
        </p>
        <div class="downloads">
          <button type="button" class="primary" :disabled="downloading" @click="downloadCsv">Exporter en CSV</button>
          <button type="button" class="primary" :disabled="downloading" @click="downloadReport">Télécharger le rapport PDF</button>
        </div>
      </AppCard>

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
import { onMounted, ref, watch } from 'vue';
import { downloadFile } from '../api/client';
import type { Observation } from '../api/types';
import AppCard from '../components/AppCard.vue';
import ObservationsTable from '../components/ObservationsTable.vue';
import PageHeader from '../components/PageHeader.vue';
import { useDogsStore } from '../stores/dogs';
import { useEthogramStore } from '../stores/ethogram';
import { useObservationsStore } from '../stores/observations';
import { useToastsStore } from '../stores/toasts';
import { daysAgo, endOfLocalDay, startOfLocalDay, toInputDate } from '../utils/period';

const dogsStore = useDogsStore();
const ethogramStore = useEthogramStore();
const observationsStore = useObservationsStore();
const toasts = useToastsStore();

const downloading = ref(false);

async function download(path: string, filename: string) {
  downloading.value = true;
  try {
    await downloadFile(path, filename);
  } catch (error) {
    toasts.error((error as Error).message);
  } finally {
    downloading.value = false;
  }
}

function downloadCsv() {
  const dog = dogsStore.selectedDog;
  if (dog) {
    download(`/exports/observations.csv?dogId=${dog.id}`, `jane-${dog.name}-observations.csv`);
  }
}

function downloadReport() {
  const dog = dogsStore.selectedDog;
  if (!dog) {
    return;
  }
  const query = new URLSearchParams({
    dogId: dog.id,
    from: startOfLocalDay(toInputDate(daysAgo(30))),
    to: endOfLocalDay(toInputDate(new Date())),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  download(`/exports/report.pdf?${query}`, `jane-${dog.name}-bilan.pdf`);
}

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

<style scoped>
.downloads {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
</style>
