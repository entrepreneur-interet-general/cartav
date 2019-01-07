// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import store from './store'
import { sync } from 'vuex-router-sync'
import router from './router'

sync(store, router)
/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router
})
