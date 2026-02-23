<template>
  <section>
    <PageHeader title="Profils" subtitle="Les chiens suivis, avec leurs informations de base." />

    <AppCard title="Nouveau chien">
      <form class="form-grid" @submit.prevent="addAnimal">
        <div>
          <label for="animal-name">Nom *</label>
          <input id="animal-name" v-model="form.name" required maxlength="80" />
        </div>
        <div>
          <label for="animal-breed">Race</label>
          <input id="animal-breed" v-model="form.breed" maxlength="80" />
        </div>
        <div>
          <label for="animal-birth">Date de naissance</label>
          <input id="animal-birth" v-model="form.birthDate" type="date" />
        </div>
        <div>
          <label for="animal-sex">Sexe</label>
          <select id="animal-sex" v-model="form.sex">
            <option value="">Non précisé</option>
            <option value="MALE">Mâle</option>
            <option value="FEMALE">Femelle</option>
          </select>
        </div>
        <div class="checkbox">
          <input id="animal-neutered" v-model="form.neutered" type="checkbox" />
          <label for="animal-neutered">Stérilisé(e)</label>
        </div>
        <div class="actions">
          <button type="submit" class="primary" :disabled="saving">Ajouter</button>
        </div>
      </form>
    </AppCard>

    <h2>Chiens suivis</h2>
    <p v-if="animalsStore.loaded && animalsStore.animals.length === 0" class="muted">
      Aucun chien enregistré. Ajoutez le premier ci-dessus.
    </p>
    <div class="animal-grid">
      <AppCard v-for="animal in animalsStore.animals" :key="animal.id">
        <article>
          <h3>{{ animal.name }}</h3>
          <p class="muted">{{ describe(animal) }}</p>
          <dl>
            <dt>Âge</dt>
            <dd class="age">{{ formatAge(animal.birthDate) }}</dd>
            <dt>Stérilisé(e)</dt>
            <dd>{{ animal.neutered ? 'Oui' : 'Non' }}</dd>
          </dl>
          <ConfirmAction
            label="Supprimer"
            :message="`Supprimer ${animal.name} efface aussi ses observations et ses tests. Définitif.`"
            @confirm="removeAnimal(animal)"
          />
        </article>
      </AppCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { AnimalInput, Sex } from '../api/types';
import AppCard from '../components/AppCard.vue';
import ConfirmAction from '../components/ConfirmAction.vue';
import PageHeader from '../components/PageHeader.vue';
import type { Animal } from '../api/types';
import { useAnimalsStore } from '../stores/animals';
import { useToastsStore } from '../stores/toasts';
import { formatAge } from '../utils/format';

const animalsStore = useAnimalsStore();
const toasts = useToastsStore();
const saving = ref(false);
const form = reactive({ name: '', breed: '', birthDate: '', sex: '' as Sex | '', neutered: false });

onMounted(() => animalsStore.load());

const SEX_LABELS: Record<Sex, string> = { MALE: 'Mâle', FEMALE: 'Femelle' };

function describe(animal: Animal): string {
  return [animal.breed, animal.sex ? SEX_LABELS[animal.sex] : null].filter(Boolean).join(' · ') || 'Informations non renseignées';
}

async function removeAnimal(animal: Animal) {
  try {
    await animalsStore.remove(animal.id);
    toasts.info(`${animal.name} a été supprimé.`);
  } catch (error) {
    toasts.error((error as Error).message);
  }
}

async function addAnimal() {
  saving.value = true;
  try {
    const input: AnimalInput = {
      name: form.name.trim(),
      breed: form.breed.trim() || undefined,
      birthDate: form.birthDate || undefined,
      sex: form.sex || undefined,
      neutered: form.neutered,
    };
    await animalsStore.create(input);
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

.animal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: var(--space-4);
}

dl {
  margin: var(--space-3) 0 0;
}

dt {
  font-size: 0.85rem;
  color: var(--color-muted);
}

dd {
  margin: 0 0 var(--space-2);
}

.age {
  font-family: var(--font-heading);
  font-size: 1.6rem;
}
</style>
