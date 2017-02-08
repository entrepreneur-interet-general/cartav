import Vue from 'vue'
import Vuex from 'vuex'
import carte from '../components/map'
import filters from '../components/filter'
import es from './modules/elastic_search'
import criteriaList from '../assets/json/criteria_list_new.json'
import set from 'lodash/set'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    carte,
    filters
  },
  strict: process.env.NODE_ENV !== 'production',
  state: {
    level: 'region',
    criteria_list: criteriaList
  },
  mutations: {
    set_level (state, level) {
      state.level = level
    },
    set_criteria (state, {criteriaPath, value}) {
      set(state.criteria_list, criteriaPath, value)
    }
  },
  actions: {
    set_criteria (context, o) {
      context.commit('set_criteria', o)
      context.dispatch('queryES')
    },
    set_level (context, level) {
      if (context.state.level !== level) {
        context.commit('set_level', level)
        context.dispatch('level_changed', level)
      }
    },
    queryES (context) {
      console.log('gtgt')
      let queryPve = es.generateQuery(context.state.criteria_list, 'pve')
      let queryAcc = es.generateQuery(context.state.criteria_list, 'acc')
      let queries = {acc: queryAcc, pve: queryPve} // context.commit('set_queries', {acc: queryAcc, pve: queryPve})

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
