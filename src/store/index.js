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
    contour: {},
    accidents_value_by_filter: {},
    pve_value_by_filter: {},
    accidents_geojson: {},
    radars_geojson: {},
    accidents_agg_by_road: {},
    pve_agg_by_road: {},
    pve_geojson: {},
    dividende: 'PVE',
    divisor: 'accidents',
    localLevelDisplay: 'aggregatedByRoad',
    localLevelData: 'accidentsOnly',
    zoomActive: true,
    colorScale: Object.keys(colors)[0],
    colorScaleInverted: true,
    basemapUrl: criteriaList.basemaps[Object.keys(criteriaList.basemaps)[1]]
  },
  mutations: {
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
    }
  },
  actions: {
    set_localLevelDisplay (context, localLevelDisplay) {
      context.commit('set_localLevelDisplay', localLevelDisplay)
      if (localLevelDisplay !== 'aggregatedByRoad') {
        context.commit('set_localLevelData', 'accidentsOnly')
      }
      context.dispatch('getLocalData', {zoomActive: false})
    },
    set_localLevelData (context, localLevelData) {
      if (context.state.localLevelData !== localLevelData) {
        context.commit('set_zoomActive', false)
        context.commit('set_localLevelData', localLevelData)
      }
    },
    set_criteria (context, o) {
      if (o.type === 'bulk') {
        context.commit('set_criteria_bulk', o)
      } else {
        context.commit('set_criteria', o)
      }

      if (context.getters.view.content === 'detailedContent') {
        context.dispatch('getLocalData', {zoomActive: false})
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
    set_view (context) {
      let view = context.getters.view

      if (view.content === 'detailedContent') {
        context.dispatch('getLocalData', {zoomActive: true})
        getLevelShapesGeojson(view.contour.decoupage, view.contour.filter.value).then(res => context.commit('contour', res))
      } else if (view.content === 'metric') {
        let promises = [
          getLevelShapesGeojson(view.contour.decoupage, view.contour.filter.value),
          context.dispatch('queryESAcc'),
          context.dispatch('queryESPve')
        ]

        Promise.all(promises).then(function (values) {
          context.commit('contour', values[0])
          context.commit('accidents_data', values[1])
          context.commit('verbalisations_data', values[2])
        })
      }
      context.dispatch('getAggregationByfilter')
    },
    getAggregationByfilter (context) {
      Promise.all([
        es.generateAggregatedQueryByFilter(context.state.criteria_list, 'acc', context.getters.view),
        es.generateAggregatedQueryByFilter(context.state.criteria_list, 'pve', context.getters.view)
      ]).then(res => {
        context.commit('accidents_value_by_filter', res[0])
        context.commit('pve_value_by_filter', res[1])
      })
    },
    queryESAcc (context) {
      let state = context.state
      let query = es.generateAggregatedQuery(state.criteria_list, 'acc', context.getters.view)

      return es.search('acc', query)
    },
    queryESPve (context) {
      let state = context.state
      let query = es.generateAggregatedQuery(state.criteria_list, 'pve', context.getters.view)
      return es.search('pve', query)
    },
    getLocalData (context, options) {
      let state = context.state
      context.commit('set_zoomActive', options.zoomActive)

      if (state.localLevelDisplay === 'aggregatedByRoad') {
        let queryAcc = es.generateAggregatedQuery(state.criteria_list, 'acc', context.getters.view, ['geojson', 'num_route_or_id'])
        let queryPve = es.generateAggregatedQuery(state.criteria_list, 'pve', context.getters.view, ['geojson', 'num_route_or_id'])
        let promises = [
          es.search('acc', queryAcc),
          es.search('pve', queryPve),
          context.dispatch('getRadars')
        ]
        Promise.all(promises).then(values => {
          context.commit('accidents_agg_by_road', es.toRoadsDict(values[0]))
          context.commit('pve_agg_by_road', es.toRoadsDict(values[1]))
          context.commit('radars_geojson', values[2])
        })
      } else {
        let query = es.generateQuery(state.criteria_list, 'acc', context.getters.view)
        es.searchAsGeoJson('acc', query, 'latitude', 'longitude', accidentsFields).then(function (res) {
          context.commit('accidents_geojson', res)
        })
      }
    },
    getPVEGraphData (context, roadId) {
      let state = context.state
      let query = es.generateGraphAgg(state.criteria_list, 'pve', context.getters.view, roadId, 'LIBELLE_FAMILLE')
      return es.search('pve', query)
    },
    getRadars (context, dep) {
      let query = es.generateQuery(null, 'radars', context.getters.view)
      return es.searchAsGeoJson('radars', query, 'Coordonnées GPS cabine - latitude', 'Coordonnées GPS cabine - longitude', radarsFields)
    },
    getAccidentsFromRoadId (context, roadId) {
      let state = context.state
      let query = es.generateQuery(state.criteria_list, 'acc', context.getters.view, roadId)
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
      return aggregationLevelsInfos.contour[decoupage].name
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
        res['PVE'] = _(agg).map(x => x.doc_count).sum()
      } else {
        res['PVE'] = undefined
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
      let cs = colors[state.colorScale].slice()
      if (state.colorScaleInverted) { cs.reverse() }
      return cs
    },
    ratioLabel (state) {
      return 'Nombre de ' + state.dividende + ' par ' + state.divisor
    }
  }
})
