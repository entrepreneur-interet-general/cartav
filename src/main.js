// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './components/App.vue'
import store from './store'
import ElementUI from 'element-ui'
import { sync } from 'vuex-router-sync'
import 'element-ui/lib/theme-default/index.css'

Vue.use(ElementUI)
Vue.use(VueRouter)

const routes = [
  { path: '/', component: App },
  { path: '/carte', component: App },
  { name: 'sous-carte', path: '/carte/:level/:id', component: App }
]

const router = new VueRouter({
  routes
})

sync(store, router)
/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router
})
