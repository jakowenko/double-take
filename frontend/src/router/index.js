import { createWebHistory, createRouter } from 'vue-router';

const routes = [
  {
    path: '/',
    meta: {
      title: 'Matches',
    },
    component: () => import( '@/views/Match.vue'),
  },
  {
    path: '/config',
    meta: {
      title: 'Config',
    },
    component: () => import( '@/views/Config.vue'),
  },
  {
    path: '/train',
    meta: {
      title: 'Train',
    },
    component: () => import( '@/views/Train.vue'),
  },
  {
    path: '/login',
    meta: {
      title: 'Login',
    },
    component: () => import( '@/views/Login.vue'),
  },
  {
    path: '/tokens',
    meta: {
      title: 'Tokens',
    },
    component: () => import( '@/views/Tokens.vue'),
  },
  {
    path: '/logs',
    meta: {
      title: 'Logs',
    },
    component: () => import( '@/views/Logs.vue'),
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
  history: createWebHistory(window.ingressUrl || window.publicPath || ''),
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
