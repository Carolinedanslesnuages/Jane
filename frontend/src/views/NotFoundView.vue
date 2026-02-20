<template>
  <section>
    <PageHeader title="Page introuvable" subtitle="Cette adresse ne correspond à aucune page de Jane." />
    <RouterLink to="/profils">Retour aux profils</RouterLink>
  </section>
</template>

<script setup lang="ts">
import PageHeader from '../components/PageHeader.vue';
</script>
