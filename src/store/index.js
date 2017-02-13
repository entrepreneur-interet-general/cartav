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
    criteria_list: criteriaList,
    additional_criterias: []
  },
  mutations: {
    set_level (state, level) {
      state.level = level
    },
    set_criteria (state, {criteriaPath, value}) {
      set(state.criteria_list, criteriaPath, value)
    },
    set_additional_criterias (state, {level, name}) {
      state.additional_criterias = [{level, name}]
    },
    clear_additional_criterias (state) {
      state.additional_criterias = []
    }
  },
  actions: {
    set_criteria (context, o) {
      context.commit('set_criteria', o)
      context.dispatch('queryES')
    },
    set_level (context, {level, parentLevel, parentName}) {
      if (context.state.level !== level) {
        context.commit('set_level', level)
        console.log(parentLevel)
        console.log(parentName)
        if (parentLevel && parentName) {
          context.commit('set_additional_criterias', {level: parentLevel, name: parentName})
        } else {
          context.commit('clear_additional_criterias')
        }
        context.dispatch('level_changed', level)
        context.dispatch('queryES')
      }
    },
    queryES (context) {
      let state = context.state
      let queryPve = es.generateQuery(state.criteria_list, 'pve', state.level, state.additional_criterias)
      let queryAcc = es.generateQuery(state.criteria_list, 'acc', state.level, state.additional_criterias)
      let queries = {acc: queryAcc, pve: queryPve}

      // console.log(JSON.stringify(queryAcc))

      function dispatchESResult (type) {
        es.search(type, queries[type]).then(
          resp => context.dispatch('display', {response: resp, type: type}),
          err => console.trace(`Requête ES ${type}`, err.message)
        )
      }

      dispatchESResult('pve')
      dispatchESResult('acc')
    }
  },
  getters: {
    aggregated_acc: state => {
      return es.generateQueryAggByFilter(state.criteria_list, 'acc')
    },
    aggregated_pve: state => {
      return es.generateQueryAggByFilter(state.criteria_list, 'pve')
    },
    get_level: state => {
      return state.level
    }
  }
})
