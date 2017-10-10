import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './components/App.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/', component: App },
  { path: '/carte', component: App },
  { path: '/carte/:view', component: App },
  { name: 'sous-carte', path: '/carte/:view/:id', component: App }
]

const router = new VueRouter({
  routes
})

export default router
