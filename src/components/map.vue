<template>
    <div id="map2">
        <infoSidebar id="info-sidebar" :infoSidebarData="infoSidebarData" class=""></infoSidebar>
    </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.heat'
import 'leaflet-polylineoffset'
import '../../node_modules/leaflet/dist/leaflet.css'
import '../../node_modules/leaflet.markercluster/dist/MarkerCluster.css'
import '../../node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css'
import '../../node_modules/sidebar-v2/js/leaflet-sidebar.js'
import es from '../store/modules/elastic_search'
import '../../node_modules/font-awesome/css/font-awesome.min.css'
import infoSidebar from './info-sidebar'

function styleAccidents (feature) {
  return {
    opacity: 0,
    fillOpacity: 0
  }
}

function styleAccidentsRoads (count) {
  return function () {
    let opacity, weight
    if (count >= 10) {
      opacity = 1
      weight = 6
    } else if (count >= 5) {
      opacity = 0.8
      weight = 4
    } else if (count >= 2) {
      opacity = 0.7
      weight = 3
    } else {
      opacity = 0.5
      weight = 2
    }
    return {
      color: 'rgb(255, 0, 0)',
      opacity: opacity,
      weight: weight
    }
  }
}

function styleAccidentsRoadsDashed (count, dashed) {
  return function () {
    let res = {
      color: 'rgb(255, 0, 0)',
      opacity: 0.8,
      weight: 3
    }
    if (dashed) {
      res.dashArray = [20, 20]
      res.lineCap = 'butt'
    }
    return res
  }
}

function stylePveRoadsDashed (count, dashed) {
  return function () {
    let res = {
      color: 'rgb(0, 0, 255)',
      opacity: 0.8,
      weight: 3
    }
    if (dashed) {
      res.dashArray = [20, 20]
      res.lineCap = 'butt'
      res.dashOffset = 20
    }
    return res
  }
}

function stylePveRoads (count) {
  let opacity, weight

  if (count >= 200) {
    opacity = 1
    weight = 8
  } else if (count >= 100) {
    opacity = 0.9
    weight = 6
  } else if (count >= 50) {
    opacity = 0.8
    weight = 4
  } else if (count >= 20) {
    opacity = 0.7
    weight = 3
  } else {
    opacity = 0.5
    weight = 2
  }
  return {
    color: 'rgb(0, 0, 255)',
    opacity: opacity,
    weight: weight
  }
}

let vehiculesIcons = {
  _catv_voiture_nb: 'car',
  _catv_utilitaire_nb: 'car',
  _catv_deuxrouesmotorises_nb: 'motorcycle',
  _catv_velo_nb: 'bicycle',
  _catv_poidslourd_nb: 'truck',
  _catv_vehiculeautre_nb: 'car',
  _catv_pietons_nb: 'male'
}

function accidentIconCreateFunction (cluster) {
  let n = cluster.getAllChildMarkers().length
  let c = ' marker-cluster-'
  if (n < 3) {
    c += 'size1'
  } else if (n < 5) {
    c += 'size2'
  } else if (n < 10) {
    c += 'size3'
  } else if (n < 20) {
    c += 'size4'
  } else if (n < 30) {
    c += 'size5'
  } else if (n < 50) {
    c += 'size6'
  } else {
    c += 'size7'
  }
  return new L.DivIcon({
    html: '<div><span>' + n + '</span></div>',
    className: 'cluster-acc marker-cluster' + c,
    iconSize: new L.Point(30, 30)
  })
}

export default {
  components: {
    infoSidebar
  },
  data () {
    return {
      map: null,
      tileLayer: null,
      contourLayerGroup: L.layerGroup(),
      contourLayer: null,
      detailedContentLayerGroup: L.featureGroup(),
      detailedContentLayer: null,
      geojsonAccLayer: null,
      infoSidebarData: {
        hoverInfoData: {
          areaMouseOver: '',
          ratio: '',
          accidentsN: '',
          pveN: ''
        },
        showGraph: true,
        graphData: {}
      },
      so6: this.setOpacity(0.6),
      so3: this.setOpacity(0.3),
      slcBlack: this.setLineColor('black'),
      slcWhite: this.setLineColor('white'),
      keepLocalDataOnChange: false
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
      /*
      if (!this.keepLocalDataOnChange) {
        this.detailedContentLayerGroup.clearLayers()
      } */

      if (this.localLevelDisplay === 'cluster') {
        this.createClusterLocal('acc')
        this.detailedContentLayerGroup.addLayer(this.detailedContentLayer)
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
        accidentsOnly: {showAcc: true, styleAcc: styleAccidentsRoads, showPve: false},
        pveOnly: {showAcc: false, showPve: true, stylePve: stylePveRoads},
        accidentsAndPve: {showAcc: true, styleAcc: styleAccidentsRoadsDashed, showPve: true, stylePve: stylePveRoadsDashed},
        accidentsNoPve: {showAcc: true, styleAcc: styleAccidentsRoads, showPve: false},
        pveNoAccidents: {showAcc: false, showPve: true, stylePve: stylePveRoads}
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
          } else if (vm.localLevelData === 'accidentsAndPve') {
            include = true
            hasPve = dataPve[roadId] !== undefined
          }

          if (include) {
            let layer = L.geoJson(road.geometry, {
              style: opt.styleAcc(road.count, hasPve),
              onEachFeature: function (feature, lay) {
                lay.on({
                  mouseover: function (event) {
                    lay.setStyle({ weight: 10 })
                    L.popup()
                    .setContent('<strong>' + roadId + '</strong><br><span class="accHighlight">' + road.count + '</span> accidents')
                    .setLatLng(event.latlng)
                    .openOn(vm.map)
                  },
                  mouseout (event) {
                    vm.map.closePopup()
                    layer.resetStyle(lay)
                  }
                })
              }
            }).addTo(this.detailedContentLayerGroup) // .bringToFront()
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
          } else if (vm.localLevelData === 'accidentsAndPve') {
            include = true
            hasAcc = dataAcc[roadId] !== undefined
          }

          if (include) {
            let layer = L.geoJson(road.geometry, {
              style: opt.stylePve(road.count, hasAcc),
              onEachFeature: function (feature, lay) {
                lay.on({
                  mouseover: function (event) {
                    lay.setStyle({ weight: 10 })
                    L.popup()
                    .setContent('<strong>' + roadId + '</strong><br><span class="pveHighlight">' + road.count + '</span> pve')
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
      let l = this.accidentsLocal.features.map(function (feature) {
        return [
          feature.geometry.coordinates[1],
          feature.geometry.coordinates[0],
          1
        ]
      })
      this.detailedContentLayer = L.heatLayer(l, {radius: 25, blur: 30, minOpacity: 0.5})
      this.detailedContentLayer.addTo(this.detailedContentLayerGroup)
    },
    zoomBounds (layer) {
      if (layer) {
        if (this.view.contour.decoupage !== 'régional') {
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
      this.displayContours(this.setStyle(colorOptions), this.myOnEachFeature)
      this.zoomBounds(this.contourLayerGroup.getLayers()[0])
    },
    setCluster (type, cluster) {
      if (type === 'acc') {
        this.detailedContentLayer = cluster
      } else if (type === 'pve') {
        this.cluster_Pve = cluster
      }
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
        style: styleAccidents
      }).addTo(this.detailedContentLayerGroup)
    },
    createClusterLocal (type) {
      // cluster des accidents individuels
      this.detailedContentLayer = L.geoJson(this.accidentsLocal, {
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
                content += '<i class="fa fa-' + vehiculesIcons[p] + ' aria-hidden="true"></i> '
              }
            }
          }
          let myIcon = L.divIcon({className: 'my-div-icon', html: content, iconSize: null})
          return L.marker(latlng, {icon: myIcon})
        },
        style: styleAccidents
      })
      let cluster = L.markerClusterGroup({
        maxClusterRadius: 30,
        singleMarkerMode: false,
        iconCreateFunction: accidentIconCreateFunction
        // spiderfyDistanceMultiplier: 1
      }).addLayer(this.detailedContentLayer)
      this.setCluster(type, cluster)
    },
    setStyle (options) {
      let vm = this
      return function (feature) {
        return vm.customStyle(feature, options)
      }
    },
    count (type, id) {
      let source = {
        'accidents': this.accidents.aggregations.group_by.buckets,
        'PVE': this.verbalisations.aggregations.group_by.buckets,
        'habitants': this.contour
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
      feature.countElements.PVE = this.count('PVE', id)
      feature.countElements.habitants = this.count('habitants', id)

      if (feature.countElements[options.dividende] || feature.countElements[options.divisor]) {
        feature.countElements.ratio = feature.countElements[options.dividende] / feature.countElements[options.divisor]
      } else {
        feature.countElements.ratio = undefined
      }

      let fillColor = options.color
      let fillOpacity = 1
      if (feature.countElements.ratio !== undefined && !isNaN(feature.countElements.ratio)) {
        if (feature.countElements.ratio < this.legendScale[0]) {
          fillColor = this.colors[0]
        } else if (feature.countElements.ratio < this.legendScale[1]) {
          fillColor = this.colors[1]
        } else if (feature.countElements.ratio < this.legendScale[2]) {
          fillColor = this.colors[2]
        } else {
          fillColor = this.colors[3]
        }
      }
      return {
        color: 'white',
        weight: 2,
        opacity: 0.5,
        fillOpacity: fillOpacity,
        fillColor: fillColor
      }
    },
    setOpacity (opacity) {
      return function (e) {
        e.target.setStyle({
          fillOpacity: opacity
        })
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
      if (vm.view.content !== 'detailedContent' || vm.view.data.filter.value !== layer.geoId) {
        // disable mouseover effect on the current administrative shape when displaying detailedContent
        layer.on({
          mouseover: vm.slcBlack,
          mouseout: vm.slcWhite
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
        vm.infoSidebarData.hoverInfoData.pveN = feature.countElements ? feature.countElements.PVE : ''
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
