<template>
  <section>
    <PageHeader title="À propos de Jane" subtitle="Un carnet de terrain pour l'observation du comportement animal." />

    <p class="intro">
      Jane porte le nom de Jane Goodall, qui a montré ce que l'observation patiente du comportement animal peut apprendre.
    </p>

    <div class="grid">
      <AppCard title="Observer">
        <p>
          Un éthogramme en six catégories (exploration, jeu, repos, social, stress, élimination), avec les comportements propres à
          chaque espèce : chien, chat, cheval, et un modèle générique pour les autres. En mode événement, un clic note une
          action instantanée ; en mode état, démarrer puis arrêter mesure une durée.
        </p>
      </AppCard>
      <AppCard title="Analyser">
        <p>
          Le tableau de bord montre le budget-temps, l'évolution du stress et son contexte (heure, lieu, stimuli). Les tests
          cognitifs se chronomètrent et gardent leur historique.
        </p>
      </AppCard>
      <AppCard title="Exporter">
        <p>Les observations s'exportent en CSV pour R ou un tableur, et un rapport PDF résume les 30 derniers jours d'un animal.</p>
      </AppCard>
      <AppCard title="Vos données">
        <p>
          Chaque compte ne voit que ses propres animaux. La connexion passe par Keycloak ; supprimer un animal supprime aussi
          ses observations et ses tests.
        </p>
      </AppCard>
    </div>

    <p class="muted version">Jane v{{ version }}</p>
  </section>
</template>

<script setup lang="ts">
import AppCard from '../components/AppCard.vue';
import PageHeader from '../components/PageHeader.vue';
import { APP_VERSION as version } from '../version';
</script>

<style scoped>
.intro {
  font-size: 1.1rem;
  max-width: 44rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: var(--space-4);
}

.version {
  margin-top: var(--space-5);
}
</style>
