<template>
  <section>
    <PageHeader title="Observation" subtitle="Enregistrez les comportements au fil de l'eau, en événement ou en durée." />

    <AppCard v-if="dogsStore.loaded && !dogsStore.selectedDog">
      <p>Ajoutez d'abord un chien dans la page <RouterLink to="/profils">Profils</RouterLink> pour commencer à observer.</p>
    </AppCard>

    <template v-else-if="dogsStore.selectedDog">
      <ActiveStates :states="observationsStore.activeStates" />

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

      <div class="category-grid">
        <CategoryCard
          v-for="category in ethogramStore.categories"
          :key="category.category"
          :category="category"
          :mode="mode"
          :running-behaviors="runningBehaviors"
          :disabled="busy"
          @choose="choose"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import ActiveStates from '../components/ActiveStates.vue';
import AppCard from '../components/AppCard.vue';
import CategoryCard from '../components/CategoryCard.vue';
import PageHeader from '../components/PageHeader.vue';
import { useDogsStore } from '../stores/dogs';
import { useEthogramStore } from '../stores/ethogram';
import { useObservationsStore } from '../stores/observations';
import { useToastsStore } from '../stores/toasts';

const LOCATIONS = ['', 'Maison', 'Jardin', 'Parc', 'Extérieur', 'Autre'];
const WEATHERS = ['', 'Ensoleillé', 'Nuageux', 'Pluie', 'Orage', 'Neige'];
const STIMULI = ['', 'Calme', 'Visiteurs', 'Bruit', 'Autres animaux', 'Jouets'];

const dogsStore = useDogsStore();
const ethogramStore = useEthogramStore();
const observationsStore = useObservationsStore();
const toasts = useToastsStore();

const mode = ref<'EVENT' | 'STATE'>('EVENT');
const context = reactive({ location: '', weather: '', stimuli: '', notes: '' });

const busy = ref(false);
const runningBehaviors = computed(() => observationsStore.activeStates.map((state) => state.behavior));

/** The optional fields of the context card, without the empty ones. */
function currentContext() {
  return Object.fromEntries(Object.entries(context).filter(([, value]) => value));
}

async function choose(behavior: string) {
  const dog = dogsStore.selectedDog;
  if (!dog || busy.value) {
    return;
  }
  busy.value = true;
  try {
    if (mode.value === 'EVENT') {
      await observationsStore.recordEvent(dog.id, behavior, currentContext());
      toasts.info(`${behavior} enregistré.`);
    } else if (observationsStore.isRunning(behavior)) {
      await observationsStore.stopState(dog.id, behavior, currentContext());
      toasts.info(`${behavior} terminé et enregistré.`);
    } else {
      await observationsStore.startState(dog.id, behavior);
      toasts.info(`${behavior} démarré.`);
    }
  } catch (error) {
    toasts.error((error as Error).message);
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  await Promise.all([dogsStore.load(), ethogramStore.load()]);
});

watch(
  () => dogsStore.selectedDog?.id,
  (dogId) => (dogId ? observationsStore.refresh(dogId) : observationsStore.reset()),
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

.context-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: var(--space-4);
}
</style>
