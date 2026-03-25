/** Registers the service worker that keeps the application available offline (production builds only). */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }
  const register = () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn("Le mode hors ligne n'est pas disponible :", error);
    });
  };
  // The page may already be loaded: sign-in happens before this runs.
  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register);
  }
}
