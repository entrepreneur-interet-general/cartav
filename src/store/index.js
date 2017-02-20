import Vue from 'vue'
import Vuex from 'vuex'
import carte from '../components/map'
import filters from '../components/filter'
import es from './modules/elastic_search'
import criteriaList from '../assets/json/criteria_list_new.json'
import set from 'lodash/set'
import departements from '../assets/json/departements_wgs84.json'
import regions from '../assets/json/regions_nouvelles_wgs84.json'

Vue.use(Vuex)

/*
function sleep (milliseconds) {
  var start = new Date().getTime()
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break
    }
  }
} */

function getLevelGeojson (level, dep) {
  let promise
  // console.log('yo')
  if (level === 'region' || level === 'departement') {
    let geojson = ''
    if (level === 'region') {
      geojson = regions
    } else if (level === 'departement') {
      geojson = departements
    }
    // console.log(geojson)
    promise = new Promise(function (resolve, reject) {
      resolve(geojson)
    })
    return promise
  } else if (level === 'commune') {
    return es.getCommunesGeoJson(dep)
  }
}

export default new Vuex.Store({
  modules: {
    carte,
    filters
  },
  strict: process.env.NODE_ENV !== 'production',
  state: {
    level: 'departement',
    criteria_list: criteriaList,
    parent: {level: '', name: '', id: ''},
    accidents: {},
    verbalisations: {},
    level_geojson: departements,
    accidents_value_by_filter: {},
    pve_value_by_filter: {}
  },
  mutations: {
    set_level (state, level) {
      state.level = level
    },
    set_criteria (state, {criteriaPath, value}) {
      let cl = JSON.parse(JSON.stringify(state.criteria_list))
      set(cl, criteriaPath, value)
      state.criteria_list = cl
    },
    set_parent (state, {level, name, id}) {
      state.parent = {level: level, name: name, id: id}
    },
    clear_parent (state) {
      state.parent = {level: '', name: '', id: ''}
    },
    accidents_data (state, response) {
      // console.log(response)
      state.accidents = response
    },
    verbalisations_data (state, response) {
      // console.log(response)
      state.verbalisations = response
    },
    set_level_geojson (state, geojson) {
      state.level_geojson = geojson
    },
    accidents_value_by_filter (state, val) {
      console.log(val)
      state.accidents_value_by_filter = val
    },
    pve_value_by_filter (state, val) {
      state.pve_value_by_filter = val
    }
  },
  actions: {
    set_criteria (context, o) {
      context.commit('set_criteria', o)
      let promises = []
      promises.push(context.dispatch('queryESAcc'))
      promises.push(context.dispatch('queryESPve'))

      Promise.all([
        es.generateQueryAggByFilter(context.state.criteria_list, 'acc', context.state.parent),
        es.generateQueryAggByFilter(context.state.criteria_list, 'pve', context.state.parent)
      ]).then(res => {
        context.commit('accidents_value_by_filter', res[0])
        context.commit('pve_value_by_filter', res[1])
      })

      Promise.all(promises).then(function (values) {
        context.commit('accidents_data', values[0])
        context.commit('verbalisations_data', values[1])
      })
    },
    set_level (context, {level, parentLevel, parentName, parentId}) {
      context.commit('set_level', level)
      if (parentLevel && parentName && parentId) {
        context.commit('set_parent', {level: parentLevel, name: parentName, id: parentId})
      } else {
        context.commit('clear_parent')
      }
      // console.log(getLevelGeojson(level, parentId))
      let promises = []
      promises.push(getLevelGeojson(level, parentId))
      promises.push(context.dispatch('queryESAcc'))
      promises.push(context.dispatch('queryESPve'))

      Promise.all([
        es.generateQueryAggByFilter(context.state.criteria_list, 'acc', context.state.parent),
        es.generateQueryAggByFilter(context.state.criteria_list, 'pve', context.state.parent)
      ]).then(res => {
        context.commit('accidents_value_by_filter', res[0])
        context.commit('pve_value_by_filter', res[1])
      })

      Promise.all(promises).then(function (values) {
        // console.log('toutes les promises sont arrivées !1')
        // console.log(values)
        context.commit('set_level_geojson', values[0])
        context.commit('accidents_data', values[1])
        context.commit('verbalisations_data', values[2])
      })
    },
    queryESAcc (context) {
      let state = context.state
      let query = es.generateQuery(state.criteria_list, 'acc', state.level, state.parent)
      if (state.level === 'commune') {
        // console.log('queryAcc : ')
        // console.log(JSON.stringify(query))
      }
      return es.search('acc', query)
    },
    queryESPve (context) {
      let state = context.state
      let query = es.generateQuery(state.criteria_list, 'pve', state.level, state.parent)
      return es.search('pve', query)
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
