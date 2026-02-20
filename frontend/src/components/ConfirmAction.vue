<template>
  <span class="confirm-action">
    <button v-if="!asking" type="button" class="danger" @click="asking = true">{{ label }}</button>
    <span v-else class="question" role="alertdialog" :aria-label="label">
      <span class="message">{{ message }}</span>
      <button type="button" class="danger" @click="confirm">Confirmer</button>
      <button type="button" @click="asking = false">Annuler</button>
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ label: string; message: string }>();
const emit = defineEmits<{ confirm: [] }>();

const asking = ref(false);

function confirm() {
  asking.value = false;
  emit('confirm');
}
</script>

<style scoped>
.question {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.message {
  font-size: 0.9rem;
  color: var(--color-muted);
}
</style>
