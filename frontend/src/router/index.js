import { /* createWebHistory, */ createWebHashHistory, createRouter } from 'vue-router';
import Match from '@/views/Match.vue';
import Config from '@/views/Config.vue';
import Train from '@/views/Train.vue';

const routes = [
  {
    path: '/',
    name: 'Match',
    component: Match,
  },
  {
    path: '/config',
    name: 'Config',
    component: Config,
  },
  {
    path: '/train',
    name: 'Train',
    component: Train,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
