<template>
  <div class="share-panel">
    <h4>Partager {{ animal.name }}</h4>
    <form class="share-form" @submit.prevent="share">
      <div>
        <label :for="`share-email-${animal.id}`">Adresse e-mail du compte Jane</label>
        <input :id="`share-email-${animal.id}`" v-model="email" type="email" required placeholder="prenom@exemple.fr" />
      </div>
      <div>
        <label :for="`share-role-${animal.id}`">Droits</label>
        <select :id="`share-role-${animal.id}`" v-model="role">
          <option value="OBSERVER">Observateur : consulte et saisit</option>
          <option value="VIEWER">Lecteur : consulte seulement</option>
        </select>
      </div>
      <button type="submit" class="primary" :disabled="busy">Partager</button>
    </form>
    <p class="muted hint">La personne doit s'être connectée une fois à Jane pour avoir un compte.</p>

    <ul v-if="sharesStore.shares.length > 0" class="shares">
      <li v-for="entry in sharesStore.shares" :key="entry.id">
        <span class="who">{{ entry.displayName || entry.email }}<span v-if="entry.displayName" class="muted"> · {{ entry.email }}</span></span>
        <span class="role">{{ entry.role === 'OBSERVER' ? 'Observateur' : 'Lecteur' }}</span>
        <ConfirmAction label="Retirer" :message="`Retirer l'accès de ${entry.displayName || entry.email} ?`" @confirm="withdraw(entry.id)" />
      </li>
    </ul>
    <p v-else class="muted hint">Cet animal n'est partagé avec personne.</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Animal, ShareRole } from '../api/types';
import { useSharesStore } from '../stores/shares';
import { useToastsStore } from '../stores/toasts';
import ConfirmAction from './ConfirmAction.vue';

const props = defineProps<{ animal: Animal }>();

const sharesStore = useSharesStore();
const toasts = useToastsStore();
const email = ref('');
const role = ref<ShareRole>('OBSERVER');
const busy = ref(false);

onMounted(async () => {
  try {
    await sharesStore.load(props.animal.id);
  } catch (error) {
    toasts.error((error as Error).message);
  }
});

async function share() {
  busy.value = true;
  try {
    await sharesStore.share(props.animal.id, email.value.trim(), role.value);
    toasts.info(`${props.animal.name} est partagé avec ${email.value.trim()}.`);
    email.value = '';
  } catch (error) {
    toasts.error((error as Error).message);
  } finally {
    busy.value = false;
  }
}

async function withdraw(shareId: string) {
  try {
    await sharesStore.remove(props.animal.id, shareId);
    toasts.info('Accès retiré.');
  } catch (error) {
    toasts.error((error as Error).message);
  }
}
</script>

<style scoped>
.share-panel {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

h4 {
  margin: 0 0 var(--space-3);
  font-size: 1rem;
}

.share-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.hint {
  font-size: 0.85rem;
  margin: var(--space-2) 0;
}

.shares {
  list-style: none;
  margin: var(--space-3) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.shares li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.who {
  flex: 1;
  min-width: 10rem;
  overflow-wrap: anywhere;
}

.role {
  font-size: 0.85rem;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  background: var(--color-sand);
}
</style>
