import { createWebHistory, createRouter } from 'vue-router';
import Match from '@/views/Match.vue';

const routes = [
  {
    path: '/',
    name: 'Match',
    component: Match,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
