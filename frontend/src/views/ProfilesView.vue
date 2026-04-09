<template>
  <section>
    <PageHeader title="Profils" subtitle="Les animaux suivis, avec leurs informations de base." />

    <AppCard title="Nouvel animal">
      <AnimalForm submit-label="Ajouter" :save="addAnimal" />
    </AppCard>

    <div class="list-heading">
      <h2>Animaux suivis</h2>
      <div v-if="animalsStore.animals.length > 1" class="species-filter">
        <label for="species-filter">Espèce</label>
        <select id="species-filter" v-model="speciesFilter">
          <option value="ALL">Toutes</option>
          <option v-for="entry in SPECIES" :key="entry.value" :value="entry.value">{{ entry.label }}</option>
        </select>
      </div>
    </div>
    <p v-if="animalsStore.loaded && animalsStore.animals.length === 0" class="muted">
      Aucun animal enregistré. Ajoutez le premier ci-dessus.
    </p>
    <div class="animal-grid">
      <AppCard v-for="animal in visibleAnimals" :key="animal.id">
        <AnimalForm
          v-if="editingId === animal.id"
          :animal="animal"
          submit-label="Enregistrer"
          :save="(input) => updateAnimal(animal, input)"
          id-prefix="edit"
          @cancel="editingId = null"
        />
        <article v-else>
          <h3>{{ animal.name }}</h3>
          <p class="muted">{{ describe(animal) }}</p>
          <p v-if="!isOwner(animal)" class="shared-badge">
            Partagé par {{ animal.ownerName }} · {{ ROLE_LABELS[animal.role] }}
          </p>
          <dl>
            <dt>Âge</dt>
            <dd v-if="animal.birthDate" class="age figure">{{ formatAge(animal.birthDate) }}</dd>
            <dd v-else class="muted">Non renseigné</dd>
            <dt>Stérilisé(e)</dt>
            <dd>{{ animal.neutered ? 'Oui' : 'Non' }}</dd>
          </dl>
          <div v-if="isOwner(animal)" class="card-actions">
            <button type="button" @click="editingId = animal.id">Modifier</button>
            <button type="button" :aria-expanded="sharingId === animal.id" @click="sharingId = sharingId === animal.id ? null : animal.id">
              Partager
            </button>
            <ConfirmAction
              label="Supprimer"
              :message="`Supprimer ${animal.name} efface aussi ses observations et ses tests. Définitif.`"
              @confirm="removeAnimal(animal)"
            />
          </div>
          <div v-else class="card-actions">
            <ConfirmAction
              label="Quitter ce partage"
              :message="`Vous ne verrez plus ${animal.name}. Ses observations restent chez ${animal.ownerName}.`"
              @confirm="leaveShare(animal)"
            />
          </div>
          <SharePanel v-if="sharingId === animal.id && isOwner(animal)" :animal="animal" />
        </article>
      </AppCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Animal, AnimalInput, Sex, Species } from '../api/types';
import AnimalForm from '../components/AnimalForm.vue';
import AppCard from '../components/AppCard.vue';
import ConfirmAction from '../components/ConfirmAction.vue';
import SharePanel from '../components/SharePanel.vue';
import PageHeader from '../components/PageHeader.vue';
import { useAnimalsStore } from '../stores/animals';
import { useSharesStore } from '../stores/shares';
import { useToastsStore } from '../stores/toasts';
import { isOwner, ROLE_LABELS } from '../utils/access';
import { formatAge } from '../utils/format';
import { filterBySpecies, SPECIES, speciesLabel } from '../utils/species';

const animalsStore = useAnimalsStore();
const toasts = useToastsStore();
const sharesStore = useSharesStore();
const speciesFilter = ref<Species | 'ALL'>('ALL');
const editingId = ref<string | null>(null);
const sharingId = ref<string | null>(null);
const visibleAnimals = computed(() => filterBySpecies(animalsStore.animals, speciesFilter.value));

onMounted(() => animalsStore.load());

const SEX_LABELS: Record<Sex, string> = { MALE: 'Mâle', FEMALE: 'Femelle' };

function describe(animal: Animal): string {
  return [speciesLabel(animal.species), animal.breed, animal.sex ? SEX_LABELS[animal.sex] : null].filter(Boolean).join(' · ') || 'Informations non renseignées';
}

async function leaveShare(animal: Animal) {
  if (!animal.shareId) return;
  try {
    await sharesStore.leave(animal.id, animal.shareId);
    await animalsStore.load();
    toasts.info(`Vous ne suivez plus ${animal.name}.`);
  } catch (error) {
    toasts.error((error as Error).message);
  }
}

async function removeAnimal(animal: Animal) {
  try {
    await animalsStore.remove(animal.id);
    toasts.info(`${animal.name} a été supprimé.`);
  } catch (error) {
    toasts.error((error as Error).message);
  }
}

async function updateAnimal(animal: Animal, input: AnimalInput) {
  try {
    await animalsStore.update(animal.id, input);
    toasts.info(`${input.name} a été modifié.`);
    editingId.value = null;
  } catch (error) {
    toasts.error((error as Error).message);
    throw error;
  }
}

async function addAnimal(input: AnimalInput) {
  try {
    await animalsStore.create(input);
    toasts.info(`${input.name} a été ajouté.`);
  } catch (error) {
    toasts.error((error as Error).message);
    throw error;
  }
}
</script>

<style scoped>
.list-heading {
  margin-bottom: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}

.species-filter {
  min-width: 12rem;
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

.shared-badge {
  display: inline-block;
  margin: 0 0 var(--space-2);
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  background: var(--color-sand);
  font-size: 0.85rem;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.age {
  font-family: var(--font-heading);
  font-size: 1.6rem;
}
</style>
