<template>
  <section>
    <PageHeader title="Données" subtitle="Exports et liste complète des observations." />

    <AppCard v-if="animalsStore.loaded && !animalsStore.selectedAnimal">
      <p>Ajoutez d'abord un animal dans la page <RouterLink to="/profils">Profils</RouterLink>.</p>
    </AppCard>

    <template v-else-if="animalsStore.selectedAnimal">
      <AnimalBanner :animal="animalsStore.selectedAnimal" />
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

      <h2>Séances</h2>
      <p v-if="sessionsStore.sessions.length === 0" class="muted">Aucune séance enregistrée pour cet animal.</p>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr><th>Début</th><th>Durée</th><th>Observateur</th><th>Méthode</th><th>Observations</th><th><span class="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            <tr v-for="session in sessionsStore.sessions" :key="session.id">
              <td>{{ formatDateTime(session.startedAt) }}</td>
              <td>{{ sessionDuration(session) }}</td>
              <td>{{ session.observerName }}</td>
              <td>{{ samplingLabel(session.method) }}</td>
              <td>{{ session.observationCount }}</td>
              <td>
                <ConfirmAction label="Supprimer" message="Supprimer cette séance ? Ses observations sont conservées." @confirm="removeSession(session.id)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
import ConfirmAction from '../components/ConfirmAction.vue';
import { downloadFile } from '../api/client';
import type { Observation, ObservationSession } from '../api/types';
import AnimalBanner from '../components/AnimalBanner.vue';
import AppCard from '../components/AppCard.vue';
import ObservationsTable from '../components/ObservationsTable.vue';
import PageHeader from '../components/PageHeader.vue';
import { useAnimalsStore } from '../stores/animals';
import { useObservationsStore } from '../stores/observations';
import { useSessionsStore } from '../stores/sessions';
import { useToastsStore } from '../stores/toasts';
import { formatDateTime, formatDuration } from '../utils/format';
import { samplingLabel } from '../utils/sampling';
import { daysAgo, endOfLocalDay, startOfLocalDay, toInputDate } from '../utils/period';

const animalsStore = useAnimalsStore();
const observationsStore = useObservationsStore();
const sessionsStore = useSessionsStore();
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

/** The length of a session; "en cours" while it is open. */
function sessionDuration(session: ObservationSession): string {
  return session.endedAt
    ? formatDuration((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
    : 'en cours';
}

async function removeSession(sessionId: string) {
  const animal = animalsStore.selectedAnimal;
  if (!animal) return;
  try {
    await sessionsStore.remove(animal.id, sessionId);
    await observationsStore.loadHistory(animal.id);
    toasts.info('Séance supprimée.');
  } catch (error) {
    toasts.error((error as Error).message);
  }
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
  (animalId) => {
    if (!animalId) {
      observationsStore.reset();
      sessionsStore.reset();
      return;
    }
    observationsStore.loadHistory(animalId);
    sessionsStore.load(animalId);
  },
  { immediate: true },
);
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
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.downloads {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
</style>
