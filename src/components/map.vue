<template>
    <div id="map2">
        <infoSidebar id="info-sidebar" :infoSidebarData="infoSidebarData" class=""></infoSidebar>
        <legende></legende>
        <div v-if="infoSidebarData.showGraph">
          <chartComponent :chartData="infoSidebarData.graphData"></chartComponent>
        </div>
        <Spinner></Spinner>
    </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.heat'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'sidebar-v2/js/leaflet-sidebar.js'
import 'sidebar-v2/css/leaflet-sidebar.css'
import 'font-awesome/css/font-awesome.min.css'
import '../vendor/leaflet.pattern.js'

import es from '../store/modules/elastic_search'
import helpers from '../store/modules/map_helpers'
import infoSidebar from './info-sidebar'
import legend from './legend'
import chartComponent from './chartComponent'
import Spinner from './Spinner'

export default {
  components: {
    legende: legend,
    chartComponent: chartComponent,
    infoSidebar,
    Spinner
  },
  data () {
    return {
      map: null,
      tileLayer: null,
      contourLayerGroup: L.layerGroup(),
      contourLayer: null,
      detailedContentLayerGroup: L.featureGroup(),
      geojsonAccLayer: null,
      infoSidebarData: {
        hoverInfoData: {
          areaMouseOver: '',
          ratio: '',
          accidentsN: '',
          pveN: '',
          km_voie: ''
        },
        showGraph: true,
        graphData: {}
      },
      roadAccidentsLayerGroup: L.layerGroup()
    }
  },
  computed: {
    view () {
      return this.$store.getters.view
    },
    contour () {
      return this.$store.state.contour
    },
    accidents () {
      return this.$store.state.accidents
    },
    verbalisations () {
      return this.$store.state.verbalisations
    },
    criteria_list () {
      return this.$store.state.criteria_list
    },
    accidentsLocal () {
      return this.$store.state.accidents_geojson
    },
    accidentsLocalAgg () {
      return this.$store.state.accidents_agg_by_road
    },
    pveLocalAgg () {
      return this.$store.state.pve_agg_by_road
    },
    dividende () {
      return this.$store.state.dividende
    },
    divisor () {
      return this.$store.state.divisor
    },
    legendScale () {
      return this.$store.getters.legendScale
    },
    localLevelDisplay () {
      return this.$store.state.localLevelDisplay
    },
    localLevelData () {
      return this.$store.state.localLevelData
    },
    colors () {
      return this.$store.getters.colors
    },
    basemapUrl () {
      return this.$store.state.basemapUrl
    }
  },
  watch: {
    colors () {
      this.colorMap()
    },
    dividende () {
      this.colorMap()
    },
    divisor () {
      this.colorMap()
    },
    accidents () {
      this.colorMap()
    },
    localLevelData () {
      this.infoSidebarData.showGraph = false
      if (this.localLevelDisplay === 'aggregatedByRoad') {
        this.displayLocalLayer()
      }
    },
    accidentsLocalAgg () {
      this.infoSidebarData.showGraph = false
      this.displayLocalLayer()
    },
    accidentsLocal () {
      this.displayLocalLayer()
    },
    basemapUrl () {
      this.tileLayer.setUrl(this.basemapUrl)
    },
    '$route' (to, from) {
      this.detailedContentLayerGroup.clearLayers()
      this.$store.dispatch('set_view')
    }
  },
  methods: {
    displayContours (styleFunction = null, onEachFeatureFunction = null) {
      let vm = this
      let idName = this.$store.getters.contourFilterFieldName

      let layer = L.geoJson(this.contour, {
        style: styleFunction,
        onEachFeature: onEachFeatureFunction,
        filter (feature, layer) {
          if (vm.view.contour.filter.activated) {
            return feature.properties[idName] === vm.view.contour.filter.value
          } else {
            return true
          }
        }
      })
      this.contourLayerGroup.addLayer(layer)
      layer.bringToBack()
    },
    displayLocalLayer () {
      this.contourLayerGroup.clearLayers()
      this.detailedContentLayerGroup.clearLayers()
      let style = {
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0
      }

      if (this.localLevelDisplay === 'cluster') {
        this.detailedContentLayerGroup.addLayer(this.createClusterLocal('acc', this.accidentsLocal))
      } else if (this.localLevelDisplay === 'heatmap') {
        this.heatMap()
      } else if (this.localLevelDisplay === 'aggregatedByRoad') {
        this.aggByRoad()
      }
      if (this.$store.state.zoomActive) {
        this.map.fitBounds(this.detailedContentLayerGroup.getBounds())
      }
      this.displayContours(() => { return style }, this.myOnEachFeature)
      if (this.localLevelData !== 'accidentsOnly') {
        this.showRadars()
      }
    },
    aggByRoad (type) {
      let vm = this
      let dataAcc = this.accidentsLocalAgg
      let dataPve = this.pveLocalAgg

      let options = {
        accidentsOnly: {showAcc: true, styleAcc: helpers.styleAccidentsRoads, showPve: false},
        pveOnly: {showAcc: false, showPve: true, stylePve: helpers.stylePveRoads},
        accidentsNoPve: {showAcc: true, styleAcc: helpers.styleAccidentsRoads, showPve: false},
        pveNoAccidents: {showAcc: false, showPve: true, stylePve: helpers.stylePveRoads}
      }

      let opt = options[vm.localLevelData]

      if (opt.showAcc) {
        for (let roadId of Object.keys(dataAcc)) {
          let road = dataAcc[roadId]
          let include = false
          let hasPve = false
          if (vm.localLevelData === 'accidentsNoPve') {
            hasPve = dataPve[roadId] !== undefined
            include = !hasPve
          } else if (vm.localLevelData === 'accidentsOnly') {
            include = true
          }

          if (include) {
            L.geoJson(road.geometry, {
              style: opt.styleAcc(road.count, hasPve),
              onEachFeature: function (feature, lay) {
                lay.roadId = roadId
                lay.on({
                  mouseover: function (event) {
                    lay.setStyle({ weight: 10 })
                    L.popup()
                    .setContent('<strong>' + road.nom_route + '</strong><br><span class="accHighlight">' + road.count + '</span> accidents')
                    .setLatLng(event.latlng)
                    .openOn(vm.map)
                  },
                  mouseout (event) {
                    vm.map.closePopup()
                    lay.setStyle({ weight: lay.feature.weight })
                  },
                  click (event) {
                    vm.roadAccidentsLayerGroup.clearLayers()
                    let previousRoadId = vm.highlightedRoadLayer ? vm.highlightedRoadLayer.roadId : undefined
                    if (roadId !== previousRoadId) {
                      // First click : display cluster
                      lay.setStyle({ opacity: 0.3 })
                      if (vm.highlightedRoadLayer) {
                        // restore previously selected road
                        vm.highlightedRoadLayer.setStyle({ opacity: feature.opacity })
                      }
                      vm.highlightedRoadLayer = lay
                      vm.$store.dispatch('getAccidentsFromRoadId', roadId).then(function (res) {
                        vm.roadAccidentsLayerGroup.addLayer(vm.createClusterLocal('acc', res))
                      })
                    } else {
                      // Second click on same road : reset display
                      lay.setStyle({ opacity: feature.opacity })
                      vm.highlightedRoadLayer = null
                      vm.roadAccidentsLayerGroup.clearLayers()
                    }
                  }
                })
              }
            }).addTo(this.detailedContentLayerGroup)
          }
        }
      }

      if (opt.showPve) {
        for (let roadId of Object.keys(dataPve)) {
          let road = dataPve[roadId]
          let include = false
          let hasAcc = false
          if (vm.localLevelData === 'pveNoAccidents') {
            hasAcc = dataAcc[roadId] !== undefined
            include = !hasAcc
          } else if (vm.localLevelData === 'pveOnly') {
            include = true
          }

          if (include) {
            let layer = L.geoJson(road.geometry, {
              style: opt.stylePve(road.count, hasAcc),
              onEachFeature: function (feature, lay) {
                lay.on({
                  mouseover: function (event) {
                    lay.setStyle({ weight: 10 })
                    L.popup()
                    .setContent('<strong>' + road.nom_route + '</strong><br><span class="pveHighlight">' + road.count + '</span> pve')
                    .setLatLng(event.latlng)
                    .openOn(vm.map)
                  },
                  mouseout (event) {
                    vm.map.closePopup()
                    layer.resetStyle(lay)
                  },
                  click: function (event) {
                    vm.$store.dispatch('getPVEGraphData', roadId).then(function (res) {
                      let aggs = res.aggregations.group_by.buckets
                      let g = {
                        labels: [],
                        datasets: [
                          {
                            label: 'PVE par famille d\'infractions',
                            backgroundColor: ['#FF0505', '#FFFF05', '#FF8205', '#05FFFF', '#0505FF', '#05FF82', '#FF05FF'],
                            data: []
                          }
                        ]
                      }
                      for (let agg of aggs) {
                        g.labels.push(agg.key)
                        g.datasets[0].data.push(agg.doc_count)
                      }
                      vm.infoSidebarData.graphData = g
                    })
                    vm.infoSidebarData.showGraph = true
                  }
                })
              }
            }).addTo(this.detailedContentLayerGroup) // .bringToFront()
          }
        }
      }
    },
    heatMap () {
      let l = this.accidentsLocal.features.map(feature => [
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0],
        1
      ])
      this.detailedContentLayer = L.heatLayer(l, {radius: 25, blur: 30, minOpacity: 0.5})
      this.detailedContentLayer.addTo(this.detailedContentLayerGroup)
    },
    zoomBounds (layer) {
      if (layer) {
        if (this.view.name !== 'régions' && this.view.name !== 'départements' && this.view.name !== 'circonscriptions') {
          if (layer.getBounds().isValid()) {
            this.map.fitBounds(layer.getBounds())
          }
        } else {
          this.map.setView([45.853459, 2.349312], 6)
        }
      }
    },
    colorMap () {
      this.infoSidebarData.showGraph = false
      this.contourLayerGroup.clearLayers()
      let colorOptions = {
        color: 'rgba(0,0,0,0.2)',
        dividende: this.$store.state.dividende,
        divisor: this.$store.state.divisor
      }
      this.displayContours((feature) => this.customStyle(feature, colorOptions), this.myOnEachFeature)
      this.zoomBounds(this.contourLayerGroup.getLayers()[0])
    },
    showRadars () {
      L.geoJson(this.$store.state.radars_geojson, {
        onEachFeature: function (feature, layer) {
          layer.bindPopup()
          layer.on({
            click: function () {
              let content = ''
              for (let p in feature.properties) {
                if (feature.properties[p]) {
                  content += p + ': ' + feature.properties[p] + '</br>'
                }
              }
              content += '<a target="_blank" href=http://beta.datalab.mi/av/streetview2.html?posLat=' + feature.geometry.coordinates[1] + '+&posLng=' + feature.geometry.coordinates[0] + '>voir dans streetview</a></br>'
              layer.bindPopup(content)
            }
          })
        },
        pointToLayer: function (feature, latlng) {
          let content = '<i class="fa fa-camera aria-hidden="true"></i>'
          let myIcon = L.divIcon({className: 'radar-div-icon', html: content, iconSize: null})
          return L.marker(latlng, {icon: myIcon})
        },
        style: helpers.styleAccidents
      }).addTo(this.detailedContentLayerGroup)
    },
    createClusterLocal (type, data) {
      // cluster des accidents individuels
      let datalayer = L.geoJson(data, {
        onEachFeature: function (feature, layer) {
          layer.bindPopup()
          layer.on({
            click: function () {
              let content = '<i class="fa fa-info-circle" aria-hidden="true"></i></br>'
              for (let p in feature.properties) {
                if (!p.startsWith('_catv_') && feature.properties[p]) {
                  content += p + ': ' + feature.properties[p] + '</br>'
                }
              }
              content += '<a target="_blank" href=http://beta.datalab.mi/av/streetview2.html?posLat=' + feature.geometry.coordinates[1] + '+&posLng=' + feature.geometry.coordinates[0] + '>voir dans streetview</a></br>'
              layer.bindPopup(content)
              es.searchSimpleFilter('acc_usagers', 'Num_Acc', feature.properties['numéro accident']).then(function (resp) {
                content += '</br><i class="fa fa-users" aria-hidden="true"></i></br>'
                let hits = resp.hits.hits
                for (let h of hits) {
                  content += h._source['sexe'] + ', ' + h._source['catu'] + ' ' + ', ' + h._source['grav'] + '</br>'
                }
                es.searchSimpleFilter('acc_vehicules', 'Num_Acc', feature.properties['numéro accident']).then(function (resp) {
                  content += '</br><i class="fa fa-car" aria-hidden="true"></i></br>'
                  let hits = resp.hits.hits
                  for (let h of hits) {
                    let catv = h._source['catv'] ? h._source['catv'] : ''
                    let choc = h._source['choc'] ? 'choc ' + h._source['choc'] : ''
                    let manv = h._source['manv'] ? h._source['manv'] : ''
                    if (catv && choc) {
                      choc = ', ' + choc
                    }
                    if ((catv || choc) && manv) {
                      manv = ', ' + manv
                    }
                    content += catv + choc + ' ' + manv + '</br>'
                  }
                  layer.bindPopup(content)
                })
              })
            }
          })
        },
        pointToLayer: function (feature, latlng) {
          let content = ''
          for (let p in feature.properties) {
            if (p.startsWith('_catv_')) {
              for (let i = 0; i < feature.properties[p]; ++i) {
                content += '<i class="fa fa-' + helpers.vehiculesIcons[p] + ' aria-hidden="true"></i> '
              }
            }
          }
          let myIcon = L.divIcon({className: 'my-div-icon', html: content, iconSize: null})
          return L.marker(latlng, {icon: myIcon})
        },
        style: helpers.styleAccidents
      })
      return L.markerClusterGroup({
        maxClusterRadius: 30,
        singleMarkerMode: false,
        iconCreateFunction: helpers.accidentIconCreateFunction,
        spiderfyDistanceMultiplier: 1.5
      }).addLayer(datalayer)
    },
    count (type, id) {
      let source = {
        'accidents': this.accidents.aggregations.group_by.buckets,
        'PV électroniques': this.verbalisations.aggregations.group_by.buckets,
        'habitants': this.contour,
        'longueur_routes': this.contour
      }

      if (type === 'habitants') {
        let idName = this.$store.getters.contourIdFieldName
        let res = 0
        for (let f of source[type].features) {
          if (id === f.properties[idName]) {
            res = f.properties.population
            break
          }
        }
        return res
      } else if (type === 'longueur_routes') {
        let idName = this.$store.getters.contourIdFieldName
        let res = 0
        for (let f of source[type].features) {
          if (id === f.properties[idName]) {
            res = f.properties.longueur_routes
            break
          }
        }
        return res
      } else {
        let agg = source[type]
        let res = 0
        for (let i = 0; i < agg.length; ++i) {
          if (id === agg[i].key) {
            res = agg[i].doc_count
            break
          }
        }
        return res
      }
    },
    customStyle (feature, options) {
      let idName = this.$store.getters.contourIdFieldName
      let id = feature.properties[idName]

      feature.countElements = {}
      feature.countElements.accidents = this.count('accidents', id)
      feature.countElements['PV électroniques'] = this.count('PV électroniques', id)
      feature.countElements.habitants = this.count('habitants', id)
      feature.countElements.longueur_routes = this.count('longueur_routes', id)

      if (feature.countElements[options.dividende] || feature.countElements[options.divisor]) {
        feature.countElements.ratio = feature.countElements[options.dividende] / feature.countElements[options.divisor]
      } else {
        feature.countElements.ratio = undefined
      }

      let stripesParams = {
        spaceColor: '#000000',
        spaceOpacity: 0.8
      }
      if (feature.countElements.ratio !== undefined && !isNaN(feature.countElements.ratio)) {
        let index = this.legendScale.findIndex(s => feature.countElements.ratio < s)
        index = (index === -1) ? this.legendScale.length : index
        stripesParams.color = this.colors[index]
        stripesParams.weight = this.$store.getters.stripes[index].weight
        stripesParams.angle = this.$store.getters.stripes[index].angle
      }
      let stripes = new L.StripePattern(stripesParams).addTo(this.map)
      return {
        color: 'white',
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0.5,
        fillPattern: stripes
      }
    },
    setLineColor (color) {
      return function (e) {
        e.target.bringToFront()
        e.target.setStyle({
          color: color
        })
      }
    },
    myOnEachFeature (feature, layer) {
      let vm = this
      let id = this.$store.getters.contourIdFieldName
      let displayName = this.$store.getters.contourDisplayFieldName

      layer.geoId = feature.properties[id]
      layer.displayName = feature.properties[displayName]
      layer.km_voie = feature.properties.longueur_routes
      if (vm.view.content !== 'detailedContent' || vm.view.data.filter.value !== layer.geoId) {
        // disable mouseover effect on the current administrative shape when displaying detailedContent
        layer.on({
          mouseover: this.setLineColor('black'),
          mouseout: this.setLineColor('white')
        })
      }

      this.linkHoverInfoToLayer(feature, layer)

      layer.on('click', function (e) {
        vm.map.closePopup()
        let linksTo = vm.view.linksTo
        let route = {
          name: 'sous-carte',
          params: { view: linksTo, id: layer.geoId }
        }

        // Si on choisit une zone équivalente, on la remplace dans l’historique
        // En faisant « arrière », on remonte d’un niveau
        if (vm.$store.getters.viewLinksToItself) {
          vm.$router.replace(route)
        } else {
          vm.$router.push(route)
        }
      })
    },
    linkHoverInfoToLayer (feature, layer) {
      let vm = this
      layer.on('mouseover', function (e) {
        vm.infoSidebarData.hoverInfoData.areaMouseOver = layer.displayName
        vm.infoSidebarData.hoverInfoData.ratio = feature.countElements ? feature.countElements.ratio : ''
        vm.infoSidebarData.hoverInfoData.accidentsN = feature.countElements ? feature.countElements.accidents : ''
        vm.infoSidebarData.hoverInfoData.pveN = feature.countElements ? feature.countElements['PV électroniques'] : ''
        vm.infoSidebarData.hoverInfoData.km_voie = layer.km_voie
      })
    }
  },
  mounted () {
    this.map = L.map('map2', {zoomControl: false}).setView([45.853459, 2.349312], 6)
    L.control.sidebar('sidebar').addTo(this.map)

    this.tileLayer = L.tileLayer(this.basemapUrl, {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 18
    }).addTo(this.map)

    this.map.addLayer(this.contourLayerGroup)
    this.map.addLayer(this.detailedContentLayerGroup)
    this.map.addLayer(this.roadAccidentsLayerGroup)

    // On met l’état initial dans l’historique
    this.$router.push(this.$route.path)
    this.$store.dispatch('set_view')

    /* this.map.on('zoomend', (e) => {
      if (this.map.getZoom() < this.view.zoomLimit) {
        this.$router.go(-1)
      }
    }) */

    // avoid clicking and scrolling when the mouse is over the div
    let div = L.DomUtil.get('info-sidebar')
    L.DomEvent.disableScrollPropagation(div)
    L.DomEvent.disableClickPropagation(div)
  }
}
</script>

<style>
#map2 {
     height: 100%;
     width: auto;
}

/*ACCIDENTS*/
.cluster-acc div{
    color: white;
    font-weight: bold;
    font-size: 16px;
    text-shadow: 0px 0px 6px black;
}

.cluster-acc.marker-cluster-size1 {
    background-color: rgba(255, 0, 0, 0.3);
}
.cluster-acc.marker-cluster-size1 div{
    background-color: rgba(255, 0, 0, 0.3);
}

.cluster-acc.marker-cluster-size2 {
    background-color: rgba(255, 0, 0, 0.3);
}
.cluster-acc.marker-cluster-size2 div{
    background-color: rgba(255, 0, 0, 0.5);
}

.cluster-acc.marker-cluster-size3 {
    background-color: rgba(225, 0, 0, 0.6);
}
.cluster-acc.marker-cluster-size3 div{
    background-color: rgba(225, 0, 0, 0.6);
}

.cluster-acc.marker-cluster-size4 {
    background-color: rgba(200, 0, 0, 0.7);
}
.cluster-acc.marker-cluster-size4 div{
    background-color: rgba(200, 0, 0, 0.7);
}

.cluster-acc.marker-cluster-size5 {
    background-color: rgba(165, 0, 0, 0.8);
}
.cluster-acc.marker-cluster-size5 div{
    background-color: rgba(165, 0, 0, 0.8);
}

.cluster-acc.marker-cluster-size6 {
    background-color: rgba(100, 0, 0, 0.8);
}
.cluster-acc.marker-cluster-size6 div{
    background-color: rgba(100, 0, 0, 0.8);
}

.cluster-acc.marker-cluster-size7 {
    background-color: rgba(50, 0, 0, 0.8);
}
.cluster-acc.marker-cluster-size7 div{
    background-color: rgba(50, 0, 0, 0.8);
}

.cluster-acc.marker-cluster {
    background-clip: padding-box;
    border-radius: 25px;
}
.cluster-acc.marker-cluster div {
    width: 24px;
    height: 24px;
    margin-left: 3px;
    margin-top: 3px;

    text-align: center;
    border-radius: 12px;
    /*font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;*/
}
.cluster-acc.marker-cluster span {
    line-height: 25px;
}

.leaflet-tooltip {
  background-color: rgba(255, 0, 0, 0.8) !important;
  border-style: none !important;
  padding: 1px !important;
}
.leaflet-tooltip > i {
  color: white;
}

.my-div-icon {
  background-color: rgba(255, 0, 0, 0.8);
  color: white;
  white-space: nowrap;
  padding: 0.5px;
  border-radius: 3px;
}

.radar-div-icon {
  background-color: rgb(0, 0, 131);
  color: white;
  white-space: nowrap;
  padding: 2px;
  border-radius: 3px;
}

.accHighlight {
  color: rgba(255, 0, 0, 1.0);
  font-weight: bold;
}
.pveHighlight {
  color: rgb(0, 0, 255);
  font-weight: bold;
}
</style>
