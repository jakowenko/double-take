import { createWebHistory, createRouter } from 'vue-router';
import Match from '@/views/Match.vue';
import Config from '@/views/Config.vue';
import Train from '@/views/Train.vue';
import Login from '@/views/Login.vue';
import Tokens from '@/views/Tokens.vue';

const routes = [
  {
    path: '/',
    meta: {
      title: 'Matches',
    },
    component: Match,
  },
  {
    path: '/config',
    meta: {
      title: 'Config',
    },
    component: Config,
  },
  {
    path: '/train',
    meta: {
      title: 'Train',
    },
    component: Train,
  },
  {
    path: '/login',
    meta: {
      title: 'Login',
    },
    component: Login,
  },
  {
    path: '/tokens',
    meta: {
      title: 'Tokens',
    },
    component: Tokens,
  },
  {
    path: '/logout',
    beforeEnter: (to, from, next) => {
      localStorage.removeItem('token');
      next('/login');
    },
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    // Scroll to the top of the page on route navigation
    return { x: 0, y: 0 };
  },
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} | Double Take` : 'Double Take';
  next();
});

export default router;
