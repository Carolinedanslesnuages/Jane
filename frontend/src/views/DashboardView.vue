<template>
  <section>
    <PageHeader title="Tableau de bord" subtitle="Budget-temps, stress et activité sur la période choisie." />

    <AppCard v-if="dogsStore.loaded && !dogsStore.selectedDog">
      <p>Ajoutez d'abord un chien dans la page <RouterLink to="/profils">Profils</RouterLink>.</p>
    </AppCard>

    <template v-else-if="dogsStore.selectedDog">
      <div class="period">
        <div>
          <label for="period-from">Du</label>
          <input id="period-from" v-model="fromDate" type="date" :max="toDate" />
        </div>
        <div>
          <label for="period-to">Au</label>
          <input id="period-to" v-model="toDate" type="date" :min="fromDate" />
        </div>
      </div>

      <p v-if="summary && summary.totals.observations === 0" class="muted">
        Aucune donnée sur cette période pour {{ dogsStore.selectedDog.name }}. Élargissez les dates ou enregistrez des observations.
      </p>

      <div v-if="summary && summary.totals.observations > 0" class="kpis">
        <AppCard>
          <span class="kpi-label">Observations</span>
          <strong class="kpi-value">{{ summary.totals.observations }}</strong>
        </AppCard>
        <AppCard>
          <span class="kpi-label">Jours observés</span>
          <strong class="kpi-value">{{ summary.totals.observedDays }}</strong>
        </AppCard>
        <AppCard>
          <span class="kpi-label">Temps mesuré</span>
          <strong class="kpi-value">{{ formatDuration(summary.totals.measuredSeconds) || '0 s' }}</strong>
        </AppCard>
        <AppCard>
          <span class="kpi-label">Signes de stress</span>
          <strong class="kpi-value">{{ summary.totals.stressCount }}</strong>
        </AppCard>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AppCard from '../components/AppCard.vue';
import PageHeader from '../components/PageHeader.vue';
import { useDogsStore } from '../stores/dogs';
import { useEthogramStore } from '../stores/ethogram';
import { useStatsStore } from '../stores/stats';
import { useToastsStore } from '../stores/toasts';
import { formatDuration } from '../utils/format';
import { daysAgo, toInputDate } from '../utils/period';

const dogsStore = useDogsStore();
const ethogramStore = useEthogramStore();
const statsStore = useStatsStore();
const toasts = useToastsStore();

const fromDate = ref(toInputDate(daysAgo(7)));
const toDate = ref(toInputDate(new Date()));
const summary = computed(() => statsStore.summary);

async function reload() {
  const dog = dogsStore.selectedDog;
  if (!dog || !fromDate.value || !toDate.value) {
    return;
  }
  try {
    await statsStore.load(dog.id, fromDate.value, toDate.value);
  } catch (error) {
    toasts.error((error as Error).message);
  }
}

onMounted(async () => {
  await Promise.all([dogsStore.load(), ethogramStore.load()]);
});

watch([() => dogsStore.selectedDog?.id, fromDate, toDate], reload, { immediate: true });
</script>

<style scoped>
.period {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 16rem));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-4);
}

.kpi-label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.kpi-value {
  font-family: var(--font-heading);
  font-size: 1.9rem;
}
</style>
