import { computed, ref } from 'vue';
import { useNow } from './useNow';

/** A stopwatch reading in seconds, with one decimal of precision while it runs. */
export function useStopwatch() {
  const now = useNow(100);
  const startedAt = ref<number | null>(null);
  const frozenSeconds = ref(0);

  const running = computed(() => startedAt.value !== null);
  const elapsedSeconds = computed(() =>
    startedAt.value === null ? frozenSeconds.value : Math.max(0, (now.value - startedAt.value) / 1000),
  );

  function start() {
    frozenSeconds.value = 0;
    startedAt.value = Date.now();
  }

  /** Stops the stopwatch and returns the measured time in seconds, rounded to a tenth. */
  function stop(): number {
    if (startedAt.value === null) {
      return frozenSeconds.value;
    }
    frozenSeconds.value = Math.round(((Date.now() - startedAt.value) / 1000) * 10) / 10;
    startedAt.value = null;
    return frozenSeconds.value;
  }

  function reset() {
    startedAt.value = null;
    frozenSeconds.value = 0;
  }

  return { running, elapsedSeconds, start, stop, reset };
}
