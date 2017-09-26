import Vue from 'vue'
import Vuex from 'vuex'
import carte from '../components/map'
import filters from '../components/filter'
import es from './modules/elastic_search'
import criteriaList from '../assets/json/config.json'
import _ from 'lodash'
import regionsFrontieres from '../assets/json/regions_frontieres.json'
import departementsFrontieres from '../assets/json/departements_frontieres.json'
import circonscriptions from '../assets/json/circonscriptions.json'
import colors from '../assets/json/colors.json'
import views from '../assets/json/views.json'
import aggregationLevelsInfos from '../assets/json/aggregationLevelsInfos'
import furl from './modules/filters_in_url'

import CryptoJS from 'crypto-js'

Vue.use(Vuex)

let accidentsFields = {
  'numéro accident': 'Num_Acc',
  adresse: 'adr',
  ville: 'current_name',
  'origine géolocalisation': 'geo_source_display',
  'point de repère (PR)': 'PR_display',
  date: 'date_formated',
  heure: 'heures_minutes',
  luminosité: 'lum',
  'type d\'intersection': 'int',
  'conditions météo': 'atm',
  collision: 'col',
  _catv_voiture_nb: 'voiture_nb',
  _catv_deuxrouesmotorises_nb: 'deuxrouesmotorises_nb',
  _catv_velo_nb: 'velo_nb',
  _catv_poidslourd_nb: 'poidslourd_nb',
  _catv_vehiculeautre_nb: 'vehiculeautre_nb',
  _catv_pietons_nb: 'pietons_nb'
}

let radarsFields = {
  'Voie': 'Libellé voie',
  'Sens circulation': 'Sens circulation',
  'VLA': 'VLA',
  'VLA Poids Lourds': 'VLA PL',
  'Type de radar': 'Type',
  'Catégorie Miffeur': 'Catégorie Miffeur',
  'ET discriminant les voies': 'ET discriminant les voies',
  'Date de mise en service': 'Date de mise en service',
  'Zone': 'Zone',
  'Commune': 'Commune',
  'Code INSEE': 'Code INSEE',
  'Environnement de la voie': 'Environnement de la voie'

}

function getLevelShapesGeojson (decoupage, dep) {
  if (decoupage === 'régional') {
    return regionsFrontieres
  } else if (decoupage === 'départemental') {
    return departementsFrontieres
  } else if (decoupage === 'circonscriptif') {
    return circonscriptions
  }
}

function createUrlQuery (context, o) {
  let state = context.state
  let sha = context.getters.configDigest
  let query = Object.assign({}, state.route.query)
  query.filters = furl.encodeFilters(state.criteria_list)
  query.digest = sha
  query.reload = o.reload

  let services = state.services_selected.list.join('|')
  if (services) {
    query.services = services
  }
  if (context.getters.view.content === 'detailedContent') {
    query.data = state.localLevelData
    query.display = state.localLevelDisplay
  } else if (context.getters.view.content === 'metric') {
    query.dividende = state.dividende
    query.divisor = state.divisor
  }
  return query
}

export default new Vuex.Store({
  modules: {
    carte,
    filters
  },
  strict: process.env.NODE_ENV !== 'production',
  state: {
    criteria_list: JSON.parse(JSON.stringify(criteriaList.filters)),
    services_list: [],
    services_selected: {fieldName: criteriaList.services_field, list: []},
    accidents: {},
    verbalisations: {},
    contour: {},
    accidents_value_by_filter: {},
    pve_value_by_filter: {},
    accidents_geojson: {},
    radars_geojson: {},
    accidents_agg_by_road: {},
    pve_agg_by_road: {},
    pve_geojson: {},
    dividende: 'PV électroniques',
    divisor: 'accidents',
    localLevelDisplay: 'aggregatedByRoad',
    localLevelData: 'accidentsOnly',
    zoomActive: true,
    colorScale: colors.defaultColor,
    colorScaleInverted: true,
    basemapUrl: criteriaList.basemaps[Object.keys(criteriaList.basemaps)[1]],
    showSpinner: false,
    hideAll: false
  },
  mutations: {
    set_services_selected (state, list) {
      state.services_selected.list = list
    },
    set_services_list (state, list) {
      state.services_list = list
    },
    set_localLevelDisplay (state, localLevelDisplay) {
      state.localLevelDisplay = localLevelDisplay
    },
    set_localLevelData (state, localLevelData) {
      state.localLevelData = localLevelData
    },
    set_zoomActive (state, zoomActive) {
      state.zoomActive = zoomActive
    },
    set_colorScale (state, colorScale) {
      state.colorScale = colorScale
    },
    set_colorScaleInverted (state, colorScaleInverted) {
      state.colorScaleInverted = colorScaleInverted
    },
    set_criteria (state, {criteriaPath, value}) {
      _.set(state.criteria_list, criteriaPath, value)
    },
    set_criteria_bulk (state, {criteriaPath, criterias}) {
      criteriaPath += '.values.'
      for (let crit of criterias) {
        let cp = criteriaPath + crit.label
        _.set(state.criteria_list, cp, crit.value)
      }
    },
    set_criteria_list (state, encodedFilters) {
      state.criteria_list = furl.decodeFilters(state.criteria_list, encodedFilters)
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
    radars_geojson (state, geojson) {
      state.radars_geojson = geojson
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
    contour (state, geojson) {
      state.contour = geojson
    },
    set_dividende (state, dividende) {
      state.dividende = dividende
    },
    set_divisor (state, divisor) {
      state.divisor = divisor
    },
    set_basemapUrl (state, basemapUrl) {
      state.basemapUrl = basemapUrl
    },
    set_showSpinner (state, show) {
      state.showSpinner = show
    },
    toggle_hide_all (state) {
      state.hideAll = !state.hideAll
    }
  },
  actions: {
    set_services_selected (context, o) {
      context.commit('set_services_selected', o.servicesSelected)
      context.dispatch('push_url_query', {router: o.router})
    },
    set_services_list (context) {
      let promList = es.keysList('pve', criteriaList.services_field, 10000)
      promList.then(function (list) { context.commit('set_services_list', list) })
    },
    set_localLevelDisplay (context, o) {
      context.commit('set_localLevelDisplay', o.localLevelDisplay)
      context.dispatch('push_url_query', {router: o.router, reload: false})
      context.dispatch('getLocalData', {zoomActive: false})
    },
    set_localLevelData (context, o) {
      if (context.state.localLevelData !== o.localLevelData) {
        context.commit('set_zoomActive', false)
        let reload = false
        if (context.state.localLevelDisplay !== 'aggregatedByRoad' && o.localLevelData !== 'accidentsOnly') {
          context.commit('set_localLevelDisplay', 'aggregatedByRoad')
          reload = true
        }
        context.commit('set_localLevelData', o.localLevelData)
        context.dispatch('push_url_query', {router: o.router, reload: reload})
      }
    },
    push_url_query (context, o) {
      let query = createUrlQuery(context, o)
      o.router.push({path: context.state.route.path, query: query})
    },
    replace_url_query (context, o) {
      let query = createUrlQuery(context, o)
      o.router.replace({path: context.state.route.path, query: query})
    },
    set_criteria (context, o) {
      if (o.type === 'bulk') {
        context.commit('set_criteria_bulk', o)
      } else {
        context.commit('set_criteria', o)
      }
      // set_view est lancé à la main (reload: false) pour éviter le zoom automatique
      context.dispatch('push_url_query', {router: o.router, reload: false})
      context.dispatch('set_view', {router: o.router, zoomActive: false})
    },
    set_view (context, {router, zoomActive: zoomActive = true}) {
      let view = context.getters.view
      if (!context.state.query) { context.dispatch('replace_url_query', {router: router, reload: false}) }
      context.commit('contour', getLevelShapesGeojson(view.contour.decoupage, view.contour.filter.value))
      if (view.content === 'detailedContent') {
        context.dispatch('getLocalData', {zoomActive: zoomActive})
      } else if (view.content === 'metric') {
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
    getAggregationByfilter (context) {
      Promise.all([
        es.generateAggregatedQueryByFilter(context.state.criteria_list, null, 'acc', context.getters.view),
        es.generateAggregatedQueryByFilter(context.state.criteria_list, context.state.services_selected, 'pve', context.getters.view)
      ]).then(res => {
        context.commit('accidents_value_by_filter', res[0])
        context.commit('pve_value_by_filter', res[1])
      })
    },
    queryESAcc (context) {
      let state = context.state
      let query = es.generateAggregatedQuery(state.criteria_list, null, 'acc', context.getters.view)

      return es.search('acc', query)
    },
    queryESPve (context) {
      let state = context.state
      let query = es.generateAggregatedQuery(state.criteria_list, state.services_selected, 'pve', context.getters.view)
      return es.search('pve', query)
    },
    getLocalData (context, options) {
      let state = context.state
      context.commit('set_zoomActive', options.zoomActive)
      context.commit('set_showSpinner', true)

      if (state.localLevelDisplay === 'aggregatedByRoad') {
        let queryAcc = es.generateAggregatedQuery(state.criteria_list, null, 'acc', context.getters.view, ['geojson', 'num_route_or_id'])
        let queryPve = es.generateAggregatedQuery(state.criteria_list, state.services_selected, 'pve', context.getters.view, ['geojson', 'num_route_or_id'])
        let promises = [
          es.search('acc', queryAcc),
          es.search('pve', queryPve),
          context.dispatch('getRadars')
        ]
        Promise.all(promises).then(values => {
          let accidentsRoadCount = {}
          let pveRoadCount = {}
          values[0].aggregations.group_by.buckets.forEach(function (bucket) {
            accidentsRoadCount[bucket.key] = bucket.doc_count
          })
          values[1].aggregations.group_by.buckets.forEach(function (bucket) {
            pveRoadCount[bucket.key] = bucket.doc_count
          })
          context.commit('accidents_agg_by_road', es.toRoadsDict(values[0], pveRoadCount))
          context.commit('pve_agg_by_road', es.toRoadsDict(values[1], accidentsRoadCount))
          context.commit('radars_geojson', values[2])
          context.commit('set_showSpinner', false)
        })
      } else {
        let query = es.generateQuery(state.criteria_list, null, 'acc', context.getters.view)
        es.searchAsGeoJson('acc', query, 'latitude', 'longitude', accidentsFields).then(function (res) {
          context.commit('accidents_geojson', res)
          context.commit('set_showSpinner', false)
        })
      }
    },
    getPVEGraphData (context, roadId) {
      let state = context.state
      let query = es.generateGraphAgg(state.criteria_list, state.services_selected, 'pve', context.getters.view, roadId, 'LIBELLE_FAMILLE')
      return es.search('pve', query)
    },
    getRadars (context, dep) {
      let query = es.generateQuery(null, null, 'radars', context.getters.view)
      return es.searchAsGeoJson('radars', query, 'Coordonnées GPS cabine - latitude', 'Coordonnées GPS cabine - longitude', radarsFields)
    },
    getAccidentsFromRoadId (context, roadId) {
      let state = context.state
      let query = es.generateQuery(state.criteria_list, null, 'acc', context.getters.view, roadId)
      return es.searchAsGeoJson('acc', query, 'latitude', 'longitude', accidentsFields)
    }
  },
  getters: {
    // Renvoie la view décrite dans views.json correspondant à l'url de la page
    view (state) {
      let viewName = state.route.params.view || 'régions'
      let id = state.route.params.id || null
      let view = views[viewName]
      view.name = viewName

      if (id) {
        if (view.contour.filter.activated) {
          view.contour.filter.value = id
        }
        if (view.data.filter.activated) {
          view.data.filter.value = id
        }
      }

      return view
    },
    viewName (state) {
      return state.route.params.view || 'régions'
    },
    contourIdFieldName (state, getters) {
      let decoupage = getters.view.contour.decoupage
      return aggregationLevelsInfos.contour[decoupage].id
    },
    contourDisplayFieldName (state, getters) {
      let decoupage = getters.view.contour.decoupage
      return aggregationLevelsInfos.contour[decoupage].name
    },
    contourFilterDisplayFieldName (state, getters) {
      let decoupage = getters.view.contour.filter.filterCriteria
      return decoupage ? aggregationLevelsInfos.contour[decoupage].name : null
    },
    contourFilterFieldName (state, getters) {
      let filterCriteria = getters.view.contour.filter.filterCriteria
      if (filterCriteria) {
        return aggregationLevelsInfos.contour[filterCriteria].id
      } else {
        return null
      }
    },
    viewLinksToItself (state, getters) {
      let linksTo = getters.view.linksTo
      return linksTo === getters.viewName
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
        res['PV électroniques'] = _(agg).map(x => x.doc_count).sum()
      } else {
        res['PV électroniques'] = undefined
      }
      agg = _.get(state.contour, 'features', undefined)
      if (agg !== undefined) {
        if (getters.view.data.filter.activated) {
          let filter = getters.view.contour.filter.value
          let field = getters.contourFilterDisplayFieldName
          res['habitants'] = _(agg).map(x => (x.properties[field] === filter) ? x.properties.population : 0).sum()
          res['longueur_routes'] = _(agg).map(x => (x.properties[field] === filter) ? x.properties.longueur_routes : 0).sum()
        } else {
          res['habitants'] = _(agg).map(x => x.properties.population).sum()
          res['longueur_routes'] = _(agg).map(x => x.properties.longueur_routes).sum()
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
      let cs = colors.colors[state.colorScale].slice()
      if (state.colorScaleInverted) { cs.reverse() }
      return cs
    },
    stripes (state) {
      if (state.colorScaleInverted) {
        // Le slice() créé une copie et ne modifie donc pas l’état
        return colors.stripes.slice().reverse()
      } else {
        return colors.stripes
      }
    },
    ratioLabel (state) {
      let label = {
        'PV électroniques': 'de PV électroniques',
        'accidents': 'd’accidents',
        'habitants': 'd’habitants',
        'longueur_routes': 'de km de voirie'
      }
      return 'Rapport entre le nombre ' + label[state.dividende] + ' et le nombre ' + label[state.divisor]
    },
    configDigest (state) {
      return String(CryptoJS.SHA256(JSON.stringify(criteriaList.filters))).slice(0, 8)
    },
    localLevel (state, getters) {
      return getters.view.content === 'detailedContent'
    }
  }
})
