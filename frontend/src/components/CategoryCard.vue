<template>
  <section class="category-card" :style="{ '--accent': categoryColor(category.category) }">
    <h3 class="category-name">
      <span class="badge">{{ category.label }}</span>
    </h3>
    <div class="behaviors">
      <div v-for="behavior in category.behaviors" :key="behavior" class="behavior">
        <button
          type="button"
          :class="{ running: isRunning(behavior) }"
          :disabled="disabled"
          :title="category.definitions[behavior]"
          @click="emit('choose', behavior)"
        >
          {{ labelFor(behavior) }}
        </button>
        <p v-if="showDefinitions && category.definitions[behavior]" class="definition">{{ category.definitions[behavior] }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EthogramCategory } from '../api/types';
import { categoryColor } from '../utils/categories';

const props = defineProps<{
  category: EthogramCategory;
  mode: 'EVENT' | 'STATE';
  runningBehaviors: string[];
  disabled?: boolean;
  /** Show the definition of each behaviour under its button. */
  showDefinitions?: boolean;
}>();
const emit = defineEmits<{ choose: [behavior: string] }>();

function isRunning(behavior: string): boolean {
  return props.mode === 'STATE' && props.runningBehaviors.includes(behavior);
}

function labelFor(behavior: string): string {
  if (props.mode === 'EVENT') {
    return behavior;
  }
  return `${isRunning(behavior) ? 'Arrêter' : 'Démarrer'} · ${behavior}`;
}
</script>

<style scoped>
.category-card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-top: 4px solid var(--accent);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4) var(--space-4);
}

.category-name {
  margin: 0 0 var(--space-3);
  font-size: 1rem;
}

.badge {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  color: var(--color-white);
  background: var(--accent);
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
}

.behaviors {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.behaviors button {
  width: 100%;
  text-align: center;
}

.definition {
  margin: var(--space-1) 0 0;
  font-size: 0.8rem;
  line-height: 1.3;
  color: var(--color-muted);
}

.behaviors button.running {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--color-white);
}
</style>
