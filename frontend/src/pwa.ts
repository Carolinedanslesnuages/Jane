/** Registers the service worker that keeps the application available offline (production builds only). */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn("Le mode hors ligne n'est pas disponible :", error);
    });
  });
}
