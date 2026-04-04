<template>
  <section>
    <PageHeader title="Observation" subtitle="Enregistrez les comportements au fil de l'eau, en événement ou en durée." />

    <AppCard v-if="animalsStore.loaded && !animalsStore.selectedAnimal">
      <p>Ajoutez d'abord un animal dans la page <RouterLink to="/profils">Profils</RouterLink> pour commencer à observer.</p>
    </AppCard>

    <template v-else-if="animalsStore.selectedAnimal">
      <AnimalBanner :animal="animalsStore.selectedAnimal" />
      <SessionCard />

      <ActiveStates :states="observationsStore.running" />

      <fieldset class="mode">
        <legend>Mode d'observation</legend>
        <label class="radio"><input v-model="mode" type="radio" value="EVENT" /> Événement</label>
        <label class="radio"><input v-model="mode" type="radio" value="STATE" /> État</label>
        <p class="muted hint">
          {{
            mode === 'EVENT'
              ? 'Un clic enregistre une action instantanée, par exemple un aboiement.'
              : "Démarrer puis arrêter mesure la durée d'un comportement, par exemple le sommeil."
          }}
        </p>
      </fieldset>

      <ScanSamplingPanel />

      <AppCard title="Moment">
        <label class="inline"><input v-model="retroactive" type="checkbox" /> Noter après coup</label>
        <div v-if="retroactive" class="moment-grid">
          <div v-if="mode === 'EVENT'">
            <label for="moment-when">Quand ?</label>
            <input id="moment-when" v-model="when" type="datetime-local" :max="nowInput" />
          </div>
          <template v-else>
            <div>
              <label for="moment-from">Début</label>
              <input id="moment-from" v-model="from" type="datetime-local" :max="nowInput" />
            </div>
            <div>
              <label for="moment-to">Fin</label>
              <input id="moment-to" v-model="to" type="datetime-local" :max="nowInput" />
            </div>
          </template>
        </div>
        <p v-else class="muted hint">Les comportements sont enregistrés à l'instant où vous les touchez.</p>
      </AppCard>

      <AppCard title="Contexte">
        <div class="context-grid">
          <div>
            <label for="context-location">Lieu</label>
            <select id="context-location" v-model="context.location">
              <option v-for="option in LOCATIONS" :key="option" :value="option">{{ option || 'Non précisé' }}</option>
            </select>
          </div>
          <div>
            <label for="context-weather">Météo</label>
            <select id="context-weather" v-model="context.weather">
              <option v-for="option in WEATHERS" :key="option" :value="option">{{ option || 'Non précisée' }}</option>
            </select>
          </div>
          <div>
            <label for="context-stimuli">Stimuli</label>
            <select id="context-stimuli" v-model="context.stimuli">
              <option v-for="option in STIMULI" :key="option" :value="option">{{ option || 'Non précisés' }}</option>
            </select>
          </div>
          <div>
            <label for="context-notes">Notes</label>
            <input id="context-notes" v-model="context.notes" maxlength="500" />
          </div>
        </div>
      </AppCard>

      <label class="inline definitions-toggle">
        <input v-model="showDefinitions" type="checkbox" /> Afficher les définitions des comportements
      </label>

      <div class="category-grid">
        <CategoryCard
          v-for="category in categories"
          :key="category.category"
          :category="category"
          :mode="retroactive ? 'EVENT' : mode"
          :running-behaviors="retroactive ? [] : runningBehaviors"
          :disabled="busy"
          :show-definitions="showDefinitions"
          @choose="choose"
        />
      </div>

      <h2>Dernières observations</h2>
      <ObservationsTable :observations="observationsStore.recent" />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import ActiveStates from '../components/ActiveStates.vue';
import type { Animal } from '../api/types';
import AnimalBanner from '../components/AnimalBanner.vue';
import AppCard from '../components/AppCard.vue';
import CategoryCard from '../components/CategoryCard.vue';
import ObservationsTable from '../components/ObservationsTable.vue';
import PageHeader from '../components/PageHeader.vue';
import ScanSamplingPanel from '../components/ScanSamplingPanel.vue';
import SessionCard from '../components/SessionCard.vue';
import { useAnimalsStore } from '../stores/animals';
import { useEthogramStore } from '../stores/ethogram';
import { useObservationsStore } from '../stores/observations';
import { useSessionsStore } from '../stores/sessions';
import { useToastsStore } from '../stores/toasts';
import { formatDateTime } from '../utils/format';
import { fromDateTimeInput, toDateTimeInput } from '../utils/period';

const LOCATIONS = ['', 'Maison', 'Jardin', 'Parc', 'Extérieur', 'Autre'];
const WEATHERS = ['', 'Ensoleillé', 'Nuageux', 'Pluie', 'Orage', 'Neige'];
const STIMULI = ['', 'Calme', 'Visiteurs', 'Bruit', 'Autres animaux', 'Jouets'];

const animalsStore = useAnimalsStore();
const ethogramStore = useEthogramStore();
const observationsStore = useObservationsStore();
const sessionsStore = useSessionsStore();
const toasts = useToastsStore();

const mode = ref<'EVENT' | 'STATE'>('EVENT');
const context = reactive({ location: '', weather: '', stimuli: '', notes: '' });

const retroactive = ref(false);
const showDefinitions = ref(readStoredFlag('jane.showDefinitions'));
watch(showDefinitions, (value) => storeFlag('jane.showDefinitions', value));
const when = ref(toDateTimeInput(new Date()));
const from = ref(toDateTimeInput(new Date(Date.now() - 30 * 60_000)));
const to = ref(toDateTimeInput(new Date()));
/** The latest moment that can be entered: now, to the minute. */
const nowInput = computed(() => toDateTimeInput(new Date()));
const busy = ref(false);
/** The behaviours of the species of the followed animal. */
const categories = computed(() => {
  const animal = animalsStore.selectedAnimal;
  return animal ? ethogramStore.categoriesFor(animal.species) : [];
});
const runningBehaviors = computed(() => observationsStore.running.map((state) => state.behavior));

/** The optional fields of the context card, without the empty ones. */
function currentContext() {
  return Object.fromEntries(Object.entries(context).filter(([, value]) => value));
}

async function choose(behavior: string) {
  const animal = animalsStore.selectedAnimal;
  if (!animal || busy.value) {
    return;
  }
  busy.value = true;
  try {
    if (retroactive.value) {
      await chooseAfterTheFact(animal, behavior);
    } else if (mode.value === 'EVENT') {
      const outcome = await observationsStore.recordEvent(animal.id, behavior, currentContext(), `${behavior} (${animal.name})`);
      toasts.info(savedMessage(behavior, outcome));
    } else if (observationsStore.isRunning(behavior)) {
      const outcome = await observationsStore.stopState(animal.id, behavior, currentContext(), `${behavior} (${animal.name})`);
      toasts.info(outcome === 'queued' ? savedMessage(behavior, outcome) : `${behavior} terminé et enregistré.`);
    } else {
      const category = categories.value.find((entry) => entry.behaviors.includes(behavior))?.category ?? 'REST';
      const outcome = await observationsStore.startState(animal.id, behavior, category, `${behavior} (${animal.name})`);
      toasts.info(outcome === 'queued' ? `${behavior} démarré sur cet appareil, il sera envoyé au retour du réseau.` : `${behavior} démarré.`);
    }
  } catch (error) {
    toasts.error((error as Error).message);
  } finally {
    busy.value = false;
    // The open session shows how many observations it holds.
    sessionsStore.load(animal.id);
  }
}

function readStoredFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function storeFlag(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // The choice is simply not remembered.
  }
}

/** What to tell the observer: saved, or kept on the device until the network is back. */
function savedMessage(behavior: string, outcome: 'sent' | 'queued', when = ''): string {
  if (outcome === 'queued') {
    return `${behavior} conservé sur cet appareil, il partira au retour du réseau.`;
  }
  return `${behavior} enregistré${when ? ` ${when}` : ''}.`;
}

/** Records a behaviour at a past moment (event) or between two past moments (state). */
async function chooseAfterTheFact(animal: Animal, behavior: string) {
  const label = `${behavior} (${animal.name})`;
  if (mode.value === 'EVENT') {
    const outcome = await observationsStore.recordEvent(
      animal.id,
      behavior,
      { ...currentContext(), occurredAt: fromDateTimeInput(when.value) },
      label,
    );
    toasts.info(savedMessage(behavior, outcome, `à ${formatDateTime(fromDateTimeInput(when.value))}`));
    return;
  }
  const start = fromDateTimeInput(from.value);
  const end = fromDateTimeInput(to.value);
  if (new Date(end) <= new Date(start)) {
    throw new Error("La fin doit être après le début.");
  }
  const outcome = await observationsStore.logState(animal.id, behavior, start, end, currentContext(), label);
  toasts.info(savedMessage(behavior, outcome));
}

onMounted(() => animalsStore.load());

watch(
  () => animalsStore.selectedAnimal?.species,
  (species) => species && ethogramStore.load(species),
  { immediate: true },
);

watch(
  () => animalsStore.selectedAnimal?.id,
  (animalId) => (animalId ? observationsStore.refresh(animalId) : observationsStore.reset()),
  { immediate: true },
);
</script>

<style scoped>
.mode {
  border: 0;
  padding: 0;
  margin: 0 0 var(--space-4);
}

.mode legend {
  font-size: 0.85rem;
  color: var(--color-muted);
  padding: 0;
  margin-bottom: var(--space-1);
}

.radio {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-right: var(--space-5);
  font-size: 1rem;
  color: var(--color-ink);
}

.hint {
  margin: var(--space-1) 0 0;
  font-size: 0.9rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.definitions-toggle {
  margin-bottom: var(--space-3);
}

.moment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 18rem));
  gap: var(--space-4);
  margin-top: var(--space-3);
}

label.inline {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-ink);
  font-size: 1rem;
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: var(--space-4);
}
</style>
