import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { initializeAuthentication } from './auth/keycloak';
import { router } from './router';
import './styles/tokens.css';
import './styles/base.css';

async function start() {
  // Redirects to the Keycloak login page when there is no session.
  await initializeAuthentication();
  createApp(App).use(createPinia()).use(router).mount('#app');
}

start();
