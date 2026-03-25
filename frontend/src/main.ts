import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { initializeAuthentication } from './auth/keycloak';
import { setupCharts } from './charts/setup';
import { registerServiceWorker } from './pwa';
import { useConnectivityStore } from './stores/connectivity';
import { router } from './router';
import './styles/tokens.css';
import './styles/base.css';

const BLOCKED_MESSAGE = `
  <main style="max-width:32rem;margin:4rem auto;padding:0 1rem;font-family:Georgia,serif">
    <h1>Jane</h1>
    <p>La première connexion à Jane demande du réseau. Reconnectez-vous à Internet puis rechargez la page.</p>
  </main>`;

async function start() {
  const mode = await initializeAuthentication();
  if (mode === 'blocked') {
    document.getElementById('app')!.innerHTML = BLOCKED_MESSAGE;
    return;
  }
  registerServiceWorker();
  setupCharts();
  const pinia = createPinia();
  if (mode === 'offline') {
    useConnectivityStore(pinia).startOfflineSession();
  }
  createApp(App).use(pinia).use(router).mount('#app');
}

start();
