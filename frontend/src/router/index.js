import { /* createWebHistory, */ createWebHashHistory, createRouter } from 'vue-router';
import Match from '@/views/Match.vue';
import Config from '@/views/Config.vue';
import Files from '@/views/Files.vue';

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
    path: '/files',
    name: 'Files',
    component: Files,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
