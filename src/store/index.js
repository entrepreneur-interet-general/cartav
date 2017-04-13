import Vue from 'vue'
import Vuex from 'vuex'
import carte from '../components/map'
import filters from '../components/filter'
import es from './modules/elastic_search'
import criteriaList from '../assets/json/criteria_list_new.json'
import _ from 'lodash'
import regionsFrontieres from '../assets/json/regions_frontieres.json'
import departementsFrontieres from '../assets/json/departements_frontieres.json'
import $ from 'jquery'
import colors from '../assets/json/colors.json'

Vue.use(Vuex)

let accidentsFields = {
  'numéro accident': 'Num_Acc',
  'adresse': 'adr',
  'ville': 'current_name',
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
    criteria_list: criteriaList.filters,
    accidents: {},
    verbalisations: {},
    level_shape_geojson: {},
    accidents_value_by_filter: {},
    pve_value_by_filter: {},
    accidents_geojson: {},
    accidents_agg_by_road: {},
    pve_agg_by_road: {},
    pve_geojson: {},
    dividende: 'PVE',
    divisor: 'accidents',
    localLevelDisplay: 'aggregatedByRoad',
    colorScale: Object.keys(colors)[0],
    colorScaleInverted: true,
    basemapUrl: criteriaList.basemaps[Object.keys(criteriaList.basemaps)[0]]
  },
  mutations: {
    set_localLevelDisplay (state, localLevelDisplay) {
      state.localLevelDisplay = localLevelDisplay
    },
    set_colorScale (state, colorScale) {
      state.colorScale = colorScale
    },
    set_colorScaleInverted (state, colorScaleInverted) {
      state.colorScaleInverted = colorScaleInverted
    },
    set_criteria (state, {criteriaPath, value}) {
      let cl = JSON.parse(JSON.stringify(state.criteria_list))
      _.set(cl, criteriaPath, value)
      state.criteria_list = cl
    },
    accidents_data (state, response) {
      state.accidents = response
    },
    verbalisations_data (state, response) {
      state.verbalisations = response
    },
    accidents_value_by_filter (state, val) {
      state.accidents_value_by_filter = val
    },
    pve_value_by_filter (state, val) {
      state.pve_value_by_filter = val
    },
    accidents_geojson (state, geojson) {
      state.accidents_geojson = geojson
    },
    accidents_agg_by_road (state, json) {
      state.accidents_agg_by_road = json
    },
    pve_agg_by_road (state, json) {
      state.pve_agg_by_road = json
    },
    pve_geojson (state, geojson) {
      state.pve_geojson = geojson
    },
    level_shape_geojson (state, geojson) {
      state.level_shape_geojson = geojson
    },
    set_dividende (state, dividende) {
      state.dividende = dividende
    },
    set_divisor (state, divisor) {
      state.divisor = divisor
    },
    set_basemapUrl (state, basemapUrl) {
      state.basemapUrl = basemapUrl
    }
  },
  actions: {
    set_localLevelDisplay (context, localLevelDisplay) {
      context.commit('set_localLevelDisplay', localLevelDisplay)
      context.dispatch('accidentsPoints')
    },
    set_criteria (context, o) {
      context.commit('set_criteria', o)

      if (context.getters.parent.subLevel === 'local') {
        context.dispatch('accidentsPoints')
        // context.dispatch('queryESPveLocal')
      } else {
        let promises = [
          context.dispatch('queryESAcc'),
          context.dispatch('queryESPve')
        ]
        Promise.all(promises).then(function (values) {
          context.commit('accidents_data', values[0])
          context.commit('verbalisations_data', values[1])
        })
      }
      context.dispatch('getAggregationByfilter')
    },
    set_level (context) {
      let parent = context.getters.parent
      if (parent.subLevel === 'local') {
        context.dispatch('accidentsPoints')
        // context.dispatch('queryESPveLocal')
      } else {
        let promises = [
          getLevelShapesGeojson(parent.subLevel, parent.id),
          context.dispatch('queryESAcc'),
          context.dispatch('queryESPve')
        ]

        Promise.all(promises).then(function (values) {
          context.commit('level_shape_geojson', values[0])
          context.commit('accidents_data', values[1])
          context.commit('verbalisations_data', values[2])
        })
      }
      context.dispatch('getAggregationByfilter')
    },
    getAggregationByfilter (context) {
      Promise.all([
        es.generateAggregatedQueryByFilter(context.state.criteria_list, 'acc', context.getters.parent),
        es.generateAggregatedQueryByFilter(context.state.criteria_list, 'pve', context.getters.parent)
      ]).then(res => {
        context.commit('accidents_value_by_filter', res[0])
        context.commit('pve_value_by_filter', res[1])
      })
    },
    queryESAcc (context) {
      let state = context.state
      let query = es.generateAggregatedQuery(state.criteria_list, 'acc', context.getters.parent)

      return es.search('acc', query)
    },
    queryESPve (context) {
      let state = context.state
      let query = es.generateAggregatedQuery(state.criteria_list, 'pve', context.getters.parent)
      return es.search('pve', query)
    },
    accidentsPoints (context) {
      let state = context.state

      if (state.localLevelDisplay === 'aggregatedByRoad') {
        let query = es.generateAggregatedQuery(state.criteria_list, 'acc', context.getters.parent, 'geojson')
        es.search('acc', query).then(res => {
          context.commit('accidents_agg_by_road', es.toMultiLineGeojson(res))
        })
      } else {
        let query = es.generateQuery(state.criteria_list, 'acc', context.getters.parent)
        es.searchAsGeoJson('acc', query, 'latitude', 'longitude', accidentsFields).then(function (res) {
          context.commit('accidents_geojson', res)
        })
      }
    },
    queryESPveLocal (context) {
      let state = context.state
      let query = es.generateAggregatedQuery(state.criteria_list, 'pve', context.getters.parent, 'geojson')
      es.search('pve', query).then(res => {
        context.commit('pve_agg_by_road', es.toMultiLineGeojson(res))
      })
    }
  },
  getters: {
    // Quand on s’intéresse aux données des départemnts en ÎdF,
    // le level sera 'région', et id 'Île de France'
    parent (state) {
      let subLevels = {
        'france': 'région',
        'région': 'département',
        'département': 'local',
        'commune': 'local'
      }
      let level = state.route.params.level || 'france'
      return {
        level: level,
        id: state.route.params.id,
        subLevel: subLevels[level]
      }
    },
    countElements (state, getters) {
      let res = {}
      let agg = _.get(state.accidents, 'aggregations.group_by.buckets', undefined)
      if (agg !== undefined) {
        res['accidents'] = _(agg).map(x => x.doc_count).sum()
      } else {
        res['accidents'] = undefined
      }

      agg = _.get(state.verbalisations, 'aggregations.group_by.buckets', undefined)
      if (agg !== undefined) {
        res['PVE'] = _(agg).map(x => x.doc_count).sum()
      } else {
        res['PVE'] = undefined
      }

      agg = _.get(state.level_shape_geojson, 'features', undefined)
      if (agg !== undefined) {
        if (getters.parent.level === 'région') {
          let filter = getters.parent.id
          res['habitants'] = _(agg).map(x => (x.properties['NOM_REG'] === filter) ? x.properties.population : 0).sum()
        } else {
          res['habitants'] = _(agg).map(x => x.properties.population).sum()
        }
      } else {
        res['habitants'] = undefined
      }

      return res
    },
    ratioAverage (state, getters) {
      let c = getters.countElements
      return c[state.dividende] / c[state.divisor]
    },
    legendScale (state, getters) {
      let avg = getters.ratioAverage
      if (isNaN(avg)) {
        return []
      } else {
        return [0.9 * avg, avg, 1.1 * avg]
      }
    },
    colors (state) {
      let cs = colors[state.colorScale].slice()
      if (state.colorScaleInverted) { cs.reverse() }
      return cs
    },
    ratioLabel (state) {
      return 'Nombre de ' + state.dividende + ' par ' + state.divisor
    }
  }
})
