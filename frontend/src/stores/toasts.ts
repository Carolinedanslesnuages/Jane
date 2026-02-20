import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'error';
}

const DISPLAY_DURATION_MS = 4000;

export const useToastsStore = defineStore('toasts', () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 1;

  function dismiss(toastId: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== toastId);
  }

  function push(message: string, kind: Toast['kind'] = 'info') {
    const toast = { id: nextId++, message, kind };
    toasts.value.push(toast);
    setTimeout(() => dismiss(toast.id), DISPLAY_DURATION_MS);
  }

  return {
    toasts,
    dismiss,
    info: (message: string) => push(message, 'info'),
    error: (message: string) => push(message, 'error'),
  };
});
