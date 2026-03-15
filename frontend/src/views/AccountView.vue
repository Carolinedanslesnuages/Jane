<template>
  <section>
    <PageHeader title="Mon compte" subtitle="Vos informations et vos données." />

    <AppCard title="Informations">
      <dl>
        <dt>Nom</dt>
        <dd>{{ session.profile?.displayName || '–' }}</dd>
        <dt>Adresse e-mail</dt>
        <dd>{{ session.profile?.email || '–' }}</dd>
        <dt>Compte créé le</dt>
        <dd>{{ session.profile ? formatDate(session.profile.createdAt) : '–' }}</dd>
      </dl>
    </AppCard>

    <AppCard title="Exporter mes données">
      <p class="muted">Un fichier CSV avec toutes les observations de tous vos animaux, lisible avec R ou un tableur.</p>
      <button type="button" class="primary" :disabled="exporting" @click="exportAll">Exporter toutes mes données</button>
    </AppCard>

    <AppCard title="Supprimer mon compte" class="danger-zone">
      <p>
        Cette action supprime votre compte, vos animaux, leurs observations et leurs tests. <strong>Elle est définitive</strong> :
        pensez à exporter vos données avant.
      </p>
      <label for="delete-confirmation">Pour confirmer, écrivez <strong>SUPPRIMER</strong></label>
      <div class="confirm-row">
        <input id="delete-confirmation" v-model="confirmation" autocomplete="off" />
        <button type="button" class="danger" :disabled="confirmation !== 'SUPPRIMER' || deleting" @click="deleteAccount">
          Supprimer définitivement mon compte
        </button>
      </div>
    </AppCard>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { downloadFile } from '../api/client';
import AppCard from '../components/AppCard.vue';
import PageHeader from '../components/PageHeader.vue';
import { useSessionStore } from '../stores/session';
import { useToastsStore } from '../stores/toasts';
import { formatDate } from '../utils/format';

const session = useSessionStore();
const toasts = useToastsStore();

const confirmation = ref('');
const deleting = ref(false);
const exporting = ref(false);

onMounted(() => {
  if (!session.profile) {
    session.load();
  }
});

async function exportAll() {
  exporting.value = true;
  try {
    await downloadFile('/exports/observations.csv', 'jane-toutes-mes-donnees.csv');
  } catch (error) {
    toasts.error((error as Error).message);
  } finally {
    exporting.value = false;
  }
}

async function deleteAccount() {
  deleting.value = true;
  try {
    await session.deleteAccount();
  } catch (error) {
    toasts.error((error as Error).message);
    deleting.value = false;
  }
}
</script>

<style scoped>
dl {
  display: grid;
  grid-template-columns: 12rem 1fr;
  gap: var(--space-2) var(--space-4);
  margin: 0;
}

dt {
  color: var(--color-muted);
}

dd {
  margin: 0;
}

.danger-zone {
  border-color: var(--color-danger);
}

.confirm-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.confirm-row input {
  max-width: 16rem;
}
</style>
