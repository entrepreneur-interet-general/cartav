import Vue from 'vue'
import Vuex from 'vuex'
import carte from '../components/map'
import filters from '../components/filter'
import es from './modules/elastic_search'
import criteriaList from '../assets/json/criteria_list_new.json'
import _ from 'lodash'
// import departements from '../assets/json/departements_wgs84.json'
// import regions from '../assets/json/regions_nouvelles_wgs84.json'
import regionsFrontieres from '../assets/json/regions_frontieres.json'
import departementsFrontieres from '../assets/json/departements_frontieres.json'
import $ from 'jquery'

Vue.use(Vuex)

let accidentsFields = {
  'numéro accident': 'Num_Acc',
  'date': 'date_formated',
  'heure': 'heures_minutes',
  'luminosité': 'lum',
  'type d\'intersection': 'int',
  'conditions météo': 'atm',
  'collision': 'col',
  '_catv_voiture_nb': 'voiture_nb',
  '_catv_utilitaire_nb': 'utilitaire_nb',
  '_catv_deuxrouesmotorises_nb': 'deuxrouesmotorises_nb',
  '_catv_velo_nb': 'velo_nb',
  '_catv_poidslourd_nb': 'poidslourd_nb',
  '_catv_vehiculeautre_nb': 'vehiculeautre_nb',
  '_catv_pietons_nb': 'pietons_nb'
}

/*
function getLevelGeojson (level, dep) {
  let promise
  // console.log('yo')
  if (level === 'région' || level === 'département') {
    let geojson = ''
    if (level === 'région') {
      geojson = regions
    } else if (level === 'département') {
      geojson = departements
    }
    // console.log(geojson)
    promise = new Promise(function (resolve, reject) {
      resolve(geojson)
    })
    return promise
  } else if (level === 'commune') {
    console.log('get communes points')
    return es.getCommunesGeoJson(dep)
  }
}
*/

function getLevelShapesGeojson (level, dep) {
  let promise
  if (level === 'région' || level === 'département') {
    let geojson = ''
    if (level === 'région') {
      geojson = regionsFrontieres
    } else if (level === 'département') {
      geojson = departementsFrontieres
    }
    promise = new Promise(function (resolve, reject) {
      resolve(geojson)
    })
    return promise
  } else if (level === 'commune') {
    return $.getJSON('http://10.237.27.129/data/communes/' + dep + '/communes.geojson')
  }
}

export default new Vuex.Store({
  modules: {
    carte,
    filters
  },
  strict: process.env.NODE_ENV !== 'production',
  state: {
    level: '',
    criteria_list: criteriaList,
    parent: {level: '', name: '', id: ''},
    accidents: {},
    verbalisations: {},
    level_geojson: {},
    level_shape_geojson: {},
    accidents_value_by_filter: {},
    pve_value_by_filter: {},
    accidents_geojson: {},
    pve_geojson: {},
    dividende: 'accidents',
    divisor: 'habitants'
  },
  mutations: {
    set_level (state, level) {
      state.level = level
    },
    set_criteria (state, {criteriaPath, value}) {
      let cl = JSON.parse(JSON.stringify(state.criteria_list))
      _.set(cl, criteriaPath, value)
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
    // set_level_geojson (state, geojson) {
    //  state.level_geojson = geojson
    // },
    accidents_value_by_filter (state, val) {
      // console.log(val)
      state.accidents_value_by_filter = val
    },
    pve_value_by_filter (state, val) {
      state.pve_value_by_filter = val
    },
    accidents_geojson (state, geojson) {
      state.accidents_geojson = geojson
    },
    pve_geojson (state, geojson) {
      state.pve_geojson = geojson
    },
    level_shape_geojson (state, geojson) {
      // console.log('level shape geojson setté')
      state.level_shape_geojson = geojson
    },
    set_dividende (state, dividende) {
      state.dividende = dividende
    },
    set_divisor (state, divisor) {
      state.divisor = divisor
    }
  },
  actions: {
    set_criteria (context, o) {
      context.commit('set_criteria', o)

      if (context.state.level === 'local') {
        context.dispatch('accidentsPoints')
      } else {
        let promises = []
        promises.push(context.dispatch('queryESAcc'))
        promises.push(context.dispatch('queryESPve'))
        Promise.all(promises).then(function (values) {
          context.commit('accidents_data', values[0])
          context.commit('verbalisations_data', values[1])
        })
      }
      context.dispatch('getAggregationByfilter')
    },
    set_level (context, {level, parentLevel, parentName, parentId}) {
      let s = context.state
      if (level !== s.level || parentLevel !== s.parent.level || parentName !== s.parent.name || parentId !== s.parent.id) {
        context.commit('set_level', level)
        // console.log(level)
        // console.log(parentLevel)
        // console.log(parentName)
        // console.log(parentId)
        if (parentLevel && parentName && parentId) {
          context.commit('set_parent', {level: parentLevel, name: parentName, id: parentId})
        } else {
          context.commit('clear_parent')
        }

        if (level === 'local') {
          context.dispatch('accidentsPoints')
        } else {
          let promises = []
          // promises.push(getLevelGeojson(level, parentId))
          promises.push(getLevelShapesGeojson(level, parentId))
          promises.push(context.dispatch('queryESAcc'))
          promises.push(context.dispatch('queryESPve'))

          Promise.all(promises).then(function (values) {
            // context.commit('set_level_geojson', values[0])
            /* if (level === 'commune') {
              console.log(values[0])
            } */
            context.commit('level_shape_geojson', values[0])
            context.commit('accidents_data', values[1])
            context.commit('verbalisations_data', values[2])
          })
        }
        context.dispatch('getAggregationByfilter')
      }
    },
    getAggregationByfilter (context) {
      Promise.all([
        es.generateAggregatedQueryByFilter(context.state.criteria_list, 'acc', context.state.parent),
        es.generateAggregatedQueryByFilter(context.state.criteria_list, 'pve', context.state.parent)
      ]).then(res => {
        context.commit('accidents_value_by_filter', res[0])
        context.commit('pve_value_by_filter', res[1])
      })
    },
    queryESAcc (context) {
      let state = context.state
      let query = es.generateAggregatedQuery(state.criteria_list, 'acc', state.level, state.parent)

      return es.search('acc', query)
    },
    queryESPve (context) {
      let state = context.state
      let query = es.generateAggregatedQuery(state.criteria_list, 'pve', state.level, state.parent)
      return es.search('pve', query)
    },
    accidentsPoints (context) {
      let state = context.state
      let query = es.generateQuery(state.criteria_list, 'acc', state.parent)
      // console.log(JSON.stringify(state.parent))
      es.searchAsGeoJson('acc', query, 'latitude', 'longitude', accidentsFields).then(function (res) {
        // console.log(JSON.stringify(res))
        context.commit('accidents_geojson', res)
      })
    },
    queryESPveLocal (context) {
      let state = context.state
      let query = es.generateQuery(state.criteria_list, 'pve', state.parent)
      return es.searchAsGeoJson('pve', query)
    }
  },
  getters: {
    countElements (state) {
      let res = {}
      let agg = state.accidents.aggregations.group_by.buckets
      res['accidents'] = _(agg).map(x => x.doc_count).sum()

      agg = state.verbalisations.aggregations.group_by.buckets
      res['PVE'] = _(agg).map(x => x.doc_count).sum()

      agg = state.level_shape_geojson.features

      if (state.level === 'département') {
        let filter = state.parent.id
        res['habitants'] = _(agg).map(x => (x.properties['NOM_REG'] === filter) ? x.properties.population : 0).sum()
      } else {
        res['habitants'] = _(agg).map(x => x.properties.population).sum()
      }

      return res
    }
  }
})
