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

    <h2>Chiens suivis</h2>
    <p v-if="dogsStore.loaded && dogsStore.dogs.length === 0" class="muted">
      Aucun chien enregistré. Ajoutez le premier ci-dessus.
    </p>
    <div class="dog-grid">
      <AppCard v-for="dog in dogsStore.dogs" :key="dog.id">
        <article>
          <h3>{{ dog.name }}</h3>
          <p class="muted">{{ describe(dog) }}</p>
          <dl>
            <dt>Âge</dt>
            <dd class="age">{{ formatAge(dog.birthDate) }}</dd>
            <dt>Stérilisé(e)</dt>
            <dd>{{ dog.neutered ? 'Oui' : 'Non' }}</dd>
          </dl>
          <ConfirmAction
            label="Supprimer"
            :message="`Supprimer ${dog.name} efface aussi ses observations et ses tests. Définitif.`"
            @confirm="removeDog(dog)"
          />
        </article>
      </AppCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { DogInput, DogSex } from '../api/types';
import AppCard from '../components/AppCard.vue';
import ConfirmAction from '../components/ConfirmAction.vue';
import PageHeader from '../components/PageHeader.vue';
import type { Dog } from '../api/types';
import { useDogsStore } from '../stores/dogs';
import { useToastsStore } from '../stores/toasts';
import { formatAge } from '../utils/format';

const dogsStore = useDogsStore();
const toasts = useToastsStore();
const saving = ref(false);
const form = reactive({ name: '', breed: '', birthDate: '', sex: '' as DogSex | '', neutered: false });

onMounted(() => dogsStore.load());

const SEX_LABELS: Record<DogSex, string> = { MALE: 'Mâle', FEMALE: 'Femelle' };

function describe(dog: Dog): string {
  return [dog.breed, dog.sex ? SEX_LABELS[dog.sex] : null].filter(Boolean).join(' · ') || 'Informations non renseignées';
}

async function removeDog(dog: Dog) {
  try {
    await dogsStore.remove(dog.id);
    toasts.info(`${dog.name} a été supprimé.`);
  } catch (error) {
    toasts.error((error as Error).message);
  }
}

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

.dog-grid {
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
