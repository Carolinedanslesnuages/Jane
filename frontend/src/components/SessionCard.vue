<template>
  <AppCard title="Séance">
    <template v-if="sessions.openSession">
      <p class="running">
        <strong>En cours</strong> depuis {{ elapsed }} · {{ sessions.openSession.observerName }} ·
        méthode {{ samplingLabel(sessions.openSession.method).toLowerCase() }}
      </p>
      <p class="muted small">{{ sessions.openSession.observationCount }} observation(s) pour l'instant.</p>
      <div class="end-row">
        <input v-model="closingNotes" maxlength="500" placeholder="Remarque de fin de séance (facultatif)" aria-label="Remarque de fin de séance" />
        <button type="button" :disabled="!online || busy" @click="end">Terminer la séance</button>
      </div>
    </template>
    <form v-else class="start-form" @submit.prevent="start">
      <div>
        <label for="session-observer">Observateur</label>
        <input id="session-observer" v-model="observerName" maxlength="80" />
      </div>
      <div>
        <label for="session-method">Méthode</label>
        <select id="session-method" v-model="method">
          <option v-for="entry in SAMPLING_METHODS" :key="entry.value" :value="entry.value">{{ entry.label }}</option>
        </select>
      </div>
      <div class="start-action">
        <button type="submit" class="primary" :disabled="!online || busy">Démarrer une séance</button>
      </div>
      <p class="muted small description">{{ currentMethod.description }}</p>
    </form>
    <p v-if="!online" class="muted small">Les séances se démarrent et se terminent avec du réseau ; les observations notées hors ligne y seront rattachées par leur heure.</p>
  </AppCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SamplingMethod } from '../api/types';
import { useNow } from '../composables/useNow';
import { useConnectivityStore } from '../stores/connectivity';
import { useAnimalsStore } from '../stores/animals';
import { useSessionStore } from '../stores/session';
import { useSessionsStore } from '../stores/sessions';
import { useToastsStore } from '../stores/toasts';
import { formatDuration } from '../utils/format';
import { SAMPLING_METHODS, samplingLabel } from '../utils/sampling';
import AppCard from './AppCard.vue';

const sessions = useSessionsStore();
const animals = useAnimalsStore();
const account = useSessionStore();
const connectivity = useConnectivityStore();
const toasts = useToastsStore();
const now = useNow(1000);

const online = computed(() => connectivity.online);
const observerName = ref(account.label);
const method = ref<SamplingMethod>('AD_LIBITUM');
const closingNotes = ref('');
const busy = ref(false);

const currentMethod = computed(() => SAMPLING_METHODS.find((entry) => entry.value === method.value) ?? SAMPLING_METHODS[0]);
const elapsed = computed(() =>
  sessions.openSession ? formatDuration(Math.max(0, (now.value - new Date(sessions.openSession.startedAt).getTime()) / 1000)) : '',
);

// The observer field follows the account name once it is known.
watch(() => account.label, (label) => {
  if (!observerName.value) observerName.value = label;
});

watch(
  () => animals.selectedAnimal?.id,
  (animalId) => (animalId ? sessions.load(animalId) : sessions.reset()),
  { immediate: true },
);

async function start() {
  const animal = animals.selectedAnimal;
  if (!animal) return;
  busy.value = true;
  try {
    await sessions.start(animal.id, { observerName: observerName.value.trim() || undefined, method: method.value });
    toasts.info('Séance démarrée.');
  } catch (error) {
    toasts.error((error as Error).message);
  } finally {
    busy.value = false;
  }
}

async function end() {
  const animal = animals.selectedAnimal;
  const session = sessions.openSession;
  if (!animal || !session) return;
  busy.value = true;
  try {
    await sessions.end(animal.id, session.id, closingNotes.value.trim() || undefined);
    closingNotes.value = '';
    toasts.info('Séance terminée.');
  } catch (error) {
    toasts.error((error as Error).message);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.running {
  margin: 0 0 var(--space-1);
}

.small {
  font-size: 0.9rem;
  margin: 0 0 var(--space-3);
}

.start-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-4);
  align-items: end;
}

.description {
  grid-column: 1 / -1;
  margin: 0;
}

.end-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.end-row input {
  flex: 1;
  min-width: 14rem;
}
</style>
