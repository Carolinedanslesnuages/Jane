import { computed, ref, watch } from 'vue';
import { useNow } from './useNow';

/**
 * Interval sampling: a countdown that rings every `intervalMinutes`, to remind the observer
 * to note what the animal is doing at that exact moment.
 */
export function useScanSampling() {
  const now = useNow(1000);
  const intervalMinutes = ref(5);
  const active = ref(false);
  const nextScanAt = ref<number | null>(null);
  const scansDone = ref(0);
  const due = ref(false);

  const remainingSeconds = computed(() =>
    active.value && nextScanAt.value !== null ? Math.max(0, Math.ceil((nextScanAt.value - now.value) / 1000)) : null,
  );

  function scheduleNext() {
    nextScanAt.value = Date.now() + intervalMinutes.value * 60_000;
  }

  watch(now, (current) => {
    if (active.value && nextScanAt.value !== null && current >= nextScanAt.value) {
      due.value = true;
      scansDone.value += 1;
      scheduleNext();
    }
  });

  function start() {
    active.value = true;
    scansDone.value = 0;
    due.value = false;
    scheduleNext();
  }

  function stop() {
    active.value = false;
    due.value = false;
    nextScanAt.value = null;
  }

  /** Called once the observer has noted the scan. */
  function acknowledge() {
    due.value = false;
  }

  return { intervalMinutes, active, due, scansDone, remainingSeconds, start, stop, acknowledge };
}
