<template>
  <section>
    <PageHeader title="Profils" subtitle="Les chiens suivis, avec leurs informations de base." />

    <AppCard title="Nouveau chien">
      <form class="form-grid" @submit.prevent="addDog">
        <div>
          <label for="dog-name">Nom *</label>
          <input id="dog-name" v-model="form.name" required maxlength="80" />
        </div>
        <div>
          <label for="dog-breed">Race</label>
          <input id="dog-breed" v-model="form.breed" maxlength="80" />
        </div>
        <div>
          <label for="dog-birth">Date de naissance</label>
          <input id="dog-birth" v-model="form.birthDate" type="date" />
        </div>
        <div>
          <label for="dog-sex">Sexe</label>
          <select id="dog-sex" v-model="form.sex">
            <option value="">Non précisé</option>
            <option value="MALE">Mâle</option>
            <option value="FEMALE">Femelle</option>
          </select>
        </div>
        <div class="checkbox">
          <input id="dog-neutered" v-model="form.neutered" type="checkbox" />
          <label for="dog-neutered">Stérilisé(e)</label>
        </div>
        <div class="actions">
          <button type="submit" class="primary" :disabled="saving">Ajouter</button>
        </div>
      </form>
    </AppCard>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { DogInput, DogSex } from '../api/types';
import AppCard from '../components/AppCard.vue';
import PageHeader from '../components/PageHeader.vue';
import { useDogsStore } from '../stores/dogs';
import { useToastsStore } from '../stores/toasts';

const dogsStore = useDogsStore();
const toasts = useToastsStore();
const saving = ref(false);
const form = reactive({ name: '', breed: '', birthDate: '', sex: '' as DogSex | '', neutered: false });

onMounted(() => dogsStore.load());

async function addDog() {
  saving.value = true;
  try {
    const input: DogInput = {
      name: form.name.trim(),
      breed: form.breed.trim() || undefined,
      birthDate: form.birthDate || undefined,
      sex: form.sex || undefined,
      neutered: form.neutered,
    };
    await dogsStore.create(input);
    toasts.info(`${input.name} a été ajouté.`);
    Object.assign(form, { name: '', breed: '', birthDate: '', sex: '', neutered: false });
  } catch (error) {
    toasts.error((error as Error).message);
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

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
