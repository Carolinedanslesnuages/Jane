<template>
  <div v-if="outbox.pending > 0 || outbox.rejected.length > 0" class="sync-status">
    <p v-if="outbox.pending > 0" class="pending">
      <strong>{{ outbox.pending }}</strong> saisie{{ outbox.pending > 1 ? 's' : '' }} en attente d'envoi
    </p>
    <ul v-if="outbox.pending > 0" class="waiting">
      <li v-for="entry in outbox.entries()" :key="entry.id">{{ entry.label }}</li>
    </ul>
    <button v-if="outbox.pending > 0" type="button" :disabled="outbox.flushing" @click="emit('sync')">Envoyer maintenant</button>

    <div v-if="outbox.rejected.length > 0" class="rejected" role="alert">
      <p><strong>Refusées par le serveur</strong></p>
      <ul>
        <li v-for="item in outbox.rejected" :key="item.entry.id">{{ item.entry.label }} : {{ item.message }}</li>
      </ul>
      <button type="button" @click="outbox.dismissRejected()">Compris</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOutboxStore } from '../stores/outbox';

const outbox = useOutboxStore();
const emit = defineEmits<{ sync: [] }>();
</script>

<style scoped>
.sync-status {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.9rem;
}

p {
  margin: 0;
}

ul {
  margin: 0;
  padding-left: var(--space-4);
  color: var(--color-muted);
}

.rejected {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-2);
  color: var(--color-danger);
}
</style>
