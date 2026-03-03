<template>
  <section>
    <PageHeader title="Tableau de bord" subtitle="Budget-temps, stress et activité sur la période choisie." />

    <AppCard v-if="animalsStore.loaded && !animalsStore.selectedAnimal">
      <p>Ajoutez d'abord un animal dans la page <RouterLink to="/profils">Profils</RouterLink>.</p>
    </AppCard>

    <template v-else-if="animalsStore.selectedAnimal">
      <AnimalBanner :animal="animalsStore.selectedAnimal" />
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
        Aucune donnée sur cette période pour {{ animalsStore.selectedAnimal.name }}. Élargissez les dates ou enregistrez des observations.
      </p>

      <div v-if="summary && summary.totals.observations > 0" class="kpis">
        <AppCard>
          <span class="kpi-label">Observations</span>
          <strong class="kpi-value figure">{{ summary.totals.observations }}</strong>
        </AppCard>
        <AppCard>
          <span class="kpi-label">Jours observés</span>
          <strong class="kpi-value figure">{{ summary.totals.observedDays }}</strong>
        </AppCard>
        <AppCard>
          <span class="kpi-label">Temps mesuré</span>
          <strong class="kpi-value figure">{{ formatDuration(summary.totals.measuredSeconds) || '0 s' }}</strong>
        </AppCard>
        <AppCard>
          <span class="kpi-label">Signes de stress</span>
          <strong class="kpi-value figure">{{ summary.totals.stressCount }}</strong>
        </AppCard>
      </div>

      <template v-if="summary && summary.totals.observations > 0">
        <h2>Budget-temps</h2>
        <div class="chart-pair">
          <AppCard>
            <div v-if="budgetChart" class="chart"><Doughnut :data="budgetChart" :options="budgetOptions" /></div>
            <p v-else class="muted">Aucun état mesuré : utilisez le mode État pour chronométrer.</p>
          </AppCard>
          <AppCard>
            <div v-if="eventsChart" class="chart"><Bar :data="eventsChart" :options="eventsOptions" /></div>
            <p v-else class="muted">Aucun événement enregistré.</p>
          </AppCard>
        </div>

        <h2>Stress</h2>
        <p v-if="summary.stress.total === 0" class="muted">Aucun signe de stress enregistré sur cette période.</p>
        <template v-else>
          <AppCard>
            <div class="chart short"><Line v-if="stressByDay" :data="stressByDay" :options="lineOptions" /></div>
          </AppCard>
          <div class="chart-pair">
            <AppCard>
              <div class="chart short"><Bar v-if="stressByBehavior" :data="stressByBehavior" :options="barOptions('Signes les plus fréquents')" /></div>
            </AppCard>
            <AppCard>
              <p class="stress-figure">
                <span class="kpi-label">Moyenne par jour</span>
                <strong class="kpi-value figure">{{ summary.stress.averagePerDay.toFixed(1) }}</strong>
              </p>
              <p v-if="summary.stress.byBehavior[0]" class="stress-figure">
                <span class="kpi-label">Le plus fréquent</span>
                <strong>{{ summary.stress.byBehavior[0].label }}</strong>
              </p>
            </AppCard>
          </div>
          <AppCard title="Contextes du stress">
            <div class="chart-triple">
              <div class="chart short"><Bar v-if="stressByHour" :data="stressByHour" :options="barOptions('Par heure')" /></div>
              <div class="chart short">
                <Bar v-if="stressByStimulus" :data="stressByStimulus" :options="barOptions('Par stimulus')" />
                <p v-else class="muted">Aucun stimulus renseigné.</p>
              </div>
              <div class="chart short">
                <Bar v-if="stressByLocation" :data="stressByLocation" :options="barOptions('Par lieu')" />
                <p v-else class="muted">Aucun lieu renseigné.</p>
              </div>
            </div>
          </AppCard>
        </template>

        <h2>Activité quotidienne</h2>
        <AppCard>
          <div class="chart"><Bar :data="timelineChart" :options="timelineOptions" /></div>
        </AppCard>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Bar, Doughnut, Line } from 'vue-chartjs';
import AnimalBanner from '../components/AnimalBanner.vue';
import AppCard from '../components/AppCard.vue';
import PageHeader from '../components/PageHeader.vue';
import {
  buildEventsChart,
  buildStressByBehaviorChart,
  buildStressByDayChart,
  buildStressByHourChart,
  buildStressByLocationChart,
  buildStressByStimulusChart,
  buildTimeBudgetChart,
  buildTimelineChart,
} from '../charts/builders';
import { useAnimalsStore } from '../stores/animals';
import { useStatsStore } from '../stores/stats';
import { useToastsStore } from '../stores/toasts';
import { categoryLabel } from '../utils/categories';
import { formatDuration } from '../utils/format';
import { daysAgo, toInputDate } from '../utils/period';

const animalsStore = useAnimalsStore();
const statsStore = useStatsStore();
const toasts = useToastsStore();

const fromDate = ref(toInputDate(daysAgo(7)));
const toDate = ref(toInputDate(new Date()));
const summary = computed(() => statsStore.summary);

const budgetChart = computed(() => (summary.value ? buildTimeBudgetChart(summary.value, categoryLabel) : null));
const eventsChart = computed(() => (summary.value ? buildEventsChart(summary.value, categoryLabel) : null));

const timelineChart = computed(() =>
  summary.value ? buildTimelineChart(summary.value, categoryLabel) : { labels: [], datasets: [] },
);
const timelineOptions = {
  plugins: { title: { display: true, text: 'Observations par jour et par catégorie' }, legend: { position: 'bottom' as const } },
  scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } },
};

const stressByDay = computed(() => (summary.value ? buildStressByDayChart(summary.value) : null));
const stressByBehavior = computed(() => (summary.value ? buildStressByBehaviorChart(summary.value) : null));
const stressByHour = computed(() => (summary.value ? buildStressByHourChart(summary.value) : null));
const stressByStimulus = computed(() => (summary.value ? buildStressByStimulusChart(summary.value) : null));
const stressByLocation = computed(() => (summary.value ? buildStressByLocationChart(summary.value) : null));

const lineOptions = {
  plugins: { title: { display: true, text: 'Fréquence du stress par jour' }, legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
};

function barOptions(title: string) {
  return {
    plugins: { title: { display: true, text: title }, legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };
}

const budgetOptions = {
  plugins: { title: { display: true, text: 'Répartition du temps mesuré (minutes)' }, legend: { position: 'bottom' as const } },
  cutout: '55%',
};
const eventsOptions = {
  plugins: { title: { display: true, text: 'Événements par catégorie' }, legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
};

async function reload() {
  const animal = animalsStore.selectedAnimal;
  if (!animal || !fromDate.value || !toDate.value) {
    return;
  }
  try {
    await statsStore.load(animal.id, fromDate.value, toDate.value);
  } catch (error) {
    toasts.error((error as Error).message);
  }
}

onMounted(async () => {
  await animalsStore.load();
});

watch([() => animalsStore.selectedAnimal?.id, fromDate, toDate], reload, { immediate: true });
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

.chart-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: var(--space-4);
}

.chart {
  height: 20rem;
}

.chart.short {
  height: 15rem;
}

.chart-triple {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-4);
}

.stress-figure {
  margin: 0 0 var(--space-4);
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
