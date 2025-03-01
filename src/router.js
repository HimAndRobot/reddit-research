import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Debug from './views/Debug.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/debug',
    name: 'Debug',
    component: Debug
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 