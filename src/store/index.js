import Vue from 'vue'
import Vuex from 'vuex'
import carte from '../components/map'
import filters from '../components/filter'
import es from './modules/elastic_search'

Vue.use(Vuex)

export default new Vuex.Store({
 // actions,
 // getters,
  modules: {
    carte,
    filters
  },
  strict: process.env.NODE_ENV !== 'production',
  state: {
    level: 'region',
    queries: {acc: {}, pve: {}}
  },
  mutations: {
    set_level (state, level) {
      state.level = level
    },
    set_queries (state, queries) {
      state.queries = queries
    }
  },
  actions: {
    set_level (context, level) {
      if (context.state.level !== level) {
        context.commit('set_level', level)
        context.dispatch('level_changed', level)
      }
    },
    set_queries (context, queries) {
      context.commit('set_queries', queries)

      function dispatchESResult (type) {
        es.search(type, queries[type]).then(
          resp => context.dispatch('display', {response: resp, type: type}),
          err => console.trace(`Requête ES ${type}`, err.message)
        )
      }

      dispatchESResult('pve')
      dispatchESResult('acc')
    }
  }
})
