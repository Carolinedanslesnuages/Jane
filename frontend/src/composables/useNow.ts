import { onScopeDispose, ref } from 'vue';

/** A reactive "current time" in milliseconds, refreshed every `intervalMs` (stopped with its scope). */
export function useNow(intervalMs = 1000) {
  const now = ref(Date.now());
  const timer = setInterval(() => {
    now.value = Date.now();
  }, intervalMs);
  onScopeDispose(() => clearInterval(timer));
  return now;
}
