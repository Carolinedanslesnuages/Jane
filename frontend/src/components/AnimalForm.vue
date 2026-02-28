<template>
  <form class="form-grid" @submit.prevent="submit">
    <div>
      <label :for="`${idPrefix}-name`">Nom *</label>
      <input :id="`${idPrefix}-name`" v-model="form.name" required maxlength="80" />
    </div>
    <div>
      <label :for="`${idPrefix}-species`">Espèce</label>
      <select :id="`${idPrefix}-species`" v-model="form.species">
        <option v-for="entry in SPECIES" :key="entry.value" :value="entry.value">{{ entry.label }}</option>
      </select>
    </div>
    <div>
      <label :for="`${idPrefix}-breed`">Race ou variété</label>
      <input :id="`${idPrefix}-breed`" v-model="form.breed" maxlength="80" />
    </div>
    <div>
      <label :for="`${idPrefix}-birth`">Date de naissance</label>
      <input :id="`${idPrefix}-birth`" v-model="form.birthDate" type="date" />
    </div>
    <div>
      <label :for="`${idPrefix}-sex`">Sexe</label>
      <select :id="`${idPrefix}-sex`" v-model="form.sex">
        <option value="">Non précisé</option>
        <option value="MALE">Mâle</option>
        <option value="FEMALE">Femelle</option>
      </select>
    </div>
    <div class="checkbox">
      <input :id="`${idPrefix}-neutered`" v-model="form.neutered" type="checkbox" />
      <label :for="`${idPrefix}-neutered`">Stérilisé(e)</label>
    </div>
    <p v-if="speciesChanged" class="muted note">
      Changer l'espèce ne modifie pas les anciennes observations : elles gardent leurs comportements d'origine.
    </p>
    <div class="actions">
      <button v-if="animal" type="button" @click="emit('cancel')">Annuler</button>
      <button type="submit" class="primary" :disabled="saving">{{ submitLabel }}</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { Animal, AnimalInput, Sex, Species } from '../api/types';
import { SPECIES } from '../utils/species';

const props = withDefaults(
  defineProps<{
    /** The animal being edited; absent when creating a new one. */
    animal?: Animal;
    submitLabel: string;
    /** Saves the animal; the form is emptied afterwards when creating. */
    save: (input: AnimalInput) => Promise<void>;
    idPrefix?: string;
  }>(),
  { idPrefix: 'animal' },
);
const emit = defineEmits<{ cancel: [] }>();

function initialForm() {
  return {
    name: props.animal?.name ?? '',
    species: (props.animal?.species ?? 'DOG') as Species,
    breed: props.animal?.breed ?? '',
    birthDate: props.animal?.birthDate ? props.animal.birthDate.slice(0, 10) : '',
    sex: (props.animal?.sex ?? '') as Sex | '',
    neutered: props.animal?.neutered ?? false,
  };
}

const form = reactive(initialForm());
const saving = ref(false);
const speciesChanged = computed(() => props.animal !== undefined && form.species !== props.animal.species);

async function submit() {
  saving.value = true;
  try {
    await props.save({
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim() || undefined,
      birthDate: form.birthDate || undefined,
      sex: form.sex || undefined,
      neutered: form.neutered,
    });
    if (!props.animal) {
      // Keep the species: several animals of the same species are often added in a row.
      Object.assign(form, { ...initialForm(), species: form.species });
    }
  } catch {
    // The caller reports the error; the form keeps what was typed.
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: var(--space-4);
  align-items: end;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-bottom: 0.5rem;
}

.checkbox label {
  margin: 0;
  font-size: 1rem;
  color: var(--color-ink);
}

.note {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.9rem;
}

.actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
