import { createRouter, createWebHistory } from 'vue-router'
import NavHomeView from '../views/NavHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: NavHomeView,
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: {
        title: '管理后台 - 猫猫导航',
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta?.title || '猫猫导航'
  next()
})

export default router
