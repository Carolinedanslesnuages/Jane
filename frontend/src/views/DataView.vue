<template>
  <section>
    <PageHeader title="Données" subtitle="Exports et liste complète des observations." />

    <AppCard v-if="animalsStore.loaded && !animalsStore.selectedAnimal">
      <p>Ajoutez d'abord un animal dans la page <RouterLink to="/profils">Profils</RouterLink>.</p>
    </AppCard>

    <template v-else-if="animalsStore.selectedAnimal">
      <AppCard title="Exports">
        <p class="muted">
          Le CSV se lit avec R, Excel ou tout autre outil d'analyse. Le rapport PDF résume les 30 derniers jours de
          {{ animalsStore.selectedAnimal.name }}.
        </p>
        <div class="downloads">
          <button type="button" class="primary" :disabled="downloading" @click="downloadCsv">Exporter en CSV</button>
          <button type="button" class="primary" :disabled="downloading" @click="downloadReport">Télécharger le rapport PDF</button>
        </div>
      </AppCard>

      <h2>Observations de {{ animalsStore.selectedAnimal.name }}</h2>
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
import { useAnimalsStore } from '../stores/animals';
import { useObservationsStore } from '../stores/observations';
import { useToastsStore } from '../stores/toasts';
import { daysAgo, endOfLocalDay, startOfLocalDay, toInputDate } from '../utils/period';

const animalsStore = useAnimalsStore();
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
  const animal = animalsStore.selectedAnimal;
  if (animal) {
    download(`/exports/observations.csv?animalId=${animal.id}`, `jane-${animal.name}-observations.csv`);
  }
}

function downloadReport() {
  const animal = animalsStore.selectedAnimal;
  if (!animal) {
    return;
  }
  const query = new URLSearchParams({
    animalId: animal.id,
    from: startOfLocalDay(toInputDate(daysAgo(30))),
    to: endOfLocalDay(toInputDate(new Date())),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  download(`/exports/report.pdf?${query}`, `jane-${animal.name}-bilan.pdf`);
}

async function removeObservation(observation: Observation) {
  try {
    await observationsStore.removeObservation(observation.animalId, observation.id);
    toasts.info('Observation supprimée.');
  } catch (error) {
    toasts.error((error as Error).message);
  }
}

onMounted(() => animalsStore.load());

watch(
  () => animalsStore.selectedAnimal?.id,
  (animalId) => (animalId ? observationsStore.loadHistory(animalId) : observationsStore.reset()),
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
