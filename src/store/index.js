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
    parent: {level: '', name: '', id: ''},
    accidents: {},
    verbalisations: {}
  },
  mutations: {
    set_level (state, level) {
      state.level = level
    },
    set_criteria (state, {criteriaPath, value}) {
      set(state.criteria_list, criteriaPath, value)
    },
    set_parent (state, {level, name, id}) {
      state.parent = {level: level, name: name, id: id}
    },
    clear_parent (state) {
      state.parent = {level: '', name: '', id: ''}
    },
    accidents_data (state, response) {
      state.accidents = response
    },
    verbalisations_data (state, response) {
      state.verbalisations = response
    }
  },
  actions: {
    set_criteria (context, o) {
      context.commit('set_criteria', o)
      context.dispatch('queryES')
    },
    set_level (context, {level, parentLevel, parentName, parentId}) {
      if (context.state.level !== level) {
        context.commit('set_level', level)
        console.log(parentLevel)
        console.log(parentName)
        if (parentLevel && parentName && parentId) {
          context.commit('set_parent', {level: parentLevel, name: parentName, id: parentId})
        } else {
          context.commit('clear_parent')
        }
        context.dispatch('queryES')
      }
    },
    queryES (context) {
      let state = context.state
      let queryPve = es.generateQuery(state.criteria_list, 'pve', state.level, state.parent)
      let queryAcc = es.generateQuery(state.criteria_list, 'acc', state.level, state.parent)

      es.search('acc', queryAcc).then(
        resp => context.commit('accidents_data', resp),
        err => console.trace(`Requête ES accidents`, err.message)
      )

      es.search('pve', queryPve).then(
        resp => context.commit('verbalisations_data', resp),
        err => console.trace(`Requête ES verbalisations`, err.message)
      )
    }
  },
  getters: {
    aggregated_acc: state => {
      return es.generateQueryAggByFilter(state.criteria_list, 'acc', state.parent)
    },
    aggregated_pve: state => {
      return es.generateQueryAggByFilter(state.criteria_list, 'pve', state.parent)
    }
  }
})
