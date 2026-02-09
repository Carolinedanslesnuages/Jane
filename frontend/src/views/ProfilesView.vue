<template>
  <section>
    <h1>Profils</h1>

    <form @submit.prevent="addDog">
      <input v-model="form.name" placeholder="Nom" required />
      <input v-model="form.breed" placeholder="Race" />
      <button type="submit">Ajouter</button>
    </form>
    <p v-if="errorMessage">{{ errorMessage }}</p>

    <ul>
      <li v-for="dog in dogsStore.dogs" :key="dog.id">
        {{ dog.name }} <span v-if="dog.breed">· {{ dog.breed }}</span>
        <button type="button" @click="removeDog(dog.id)">Supprimer</button>
      </li>
    </ul>
    <p v-if="dogsStore.loaded && dogsStore.dogs.length === 0">Aucun chien pour l'instant.</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useDogsStore } from '../stores/dogs';

const dogsStore = useDogsStore();
const form = reactive({ name: '', breed: '' });
const errorMessage = ref('');

onMounted(() => dogsStore.load());

async function addDog() {
  errorMessage.value = '';
  try {
    await dogsStore.create({ name: form.name, breed: form.breed || undefined });
    form.name = '';
    form.breed = '';
  } catch (error) {
    errorMessage.value = (error as Error).message;
  }
}

async function removeDog(dogId: string) {
  await dogsStore.remove(dogId);
}
</script>
