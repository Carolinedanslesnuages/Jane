import { createRouter, createWebHistory } from 'vue-router';

export const routes = [
  { path: '/', redirect: '/profils' },
  { path: '/profils', name: 'profiles', component: () => import('../views/ProfilesView.vue'), meta: { label: 'Profils' } },
  { path: '/observation', name: 'observation', component: () => import('../views/ObservationView.vue'), meta: { label: 'Observation' } },
  { path: '/tests', name: 'cognitive-tests', component: () => import('../views/CognitiveTestsView.vue'), meta: { label: 'Tests cognitifs' } },
  { path: '/tableau-de-bord', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { label: 'Tableau de bord' } },
  { path: '/donnees', name: 'data', component: () => import('../views/DataView.vue'), meta: { label: 'Données' } },
  { path: '/a-propos', name: 'about', component: () => import('../views/AboutView.vue'), meta: { label: 'À propos' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Page introuvable' } },
];

/** The browser tab title of a page. */
export function pageTitle(meta: Record<string, unknown>): string {
  const name = String(meta.label ?? meta.title ?? '');
  return name ? `${name} · Jane` : 'Jane · carnet d\'observation canine';
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((route) => {
  document.title = pageTitle(route.meta);
});
