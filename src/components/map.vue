<template>
    <div id="map2">
        <infoSidebar v-if="!hideAll" id="info-sidebar" :infoSidebarData="infoSidebarData" class=""></infoSidebar>
        <legende></legende>
        <div v-if="infoSidebarData.showGraph">
          <chartComponent :chartData="infoSidebarData.graphData"></chartComponent>
        </div>
        <Spinner></Spinner>
        <Modal v-if="showModal" @close="showModal = false;">
          <h3 slot="title" class="text-info"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i></br>Lien obsolète</h3>
          <p slot="text">Ce lien a été créé par une précédente version de l'application. Nous ne pouvons pas restaurer les filtres à l'identique.</p>
        </Modal>
        <Modal v-if="showCarteAndFurious" @close="showCarteAndFurious = false;" class="black">
          <h3 slot="title" class="text-info"></h3>
          <p slot="text"><img src="static/carte-n-furious.png" alt="logo carte and furious" /><br/>
            Félicitations ! Vous avez retrouvé le vrai nom de ce projet !<br/>
            Les développeurs : Francis et Tristram
          </p>
        </Modal>
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
import { mapState } from 'vuex'
import keyboardJS from 'keyboardjs'
import 'leaflet-contextmenu'
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css'
import 'leaflet-geocoder-ban/src/leaflet-geocoder-ban.js'
import 'leaflet-geocoder-ban/src/leaflet-geocoder-ban.css'

import helpers from '../store/modules/map_helpers'
import infoSidebar from './info-sidebar'
import legend from './legend'
import chartComponent from './chartComponent'
import Spinner from './Spinner'
import Modal from './Modal'
import poll from './poll'
import constants from '../store/modules/constants'

let mobileTimeout
let tileErrorCount = 0

export default {
  components: {
    legende: legend,
    chartComponent: chartComponent,
    infoSidebar,
    Spinner,
    Modal,
    poll
  },
  data () {
    return {
      map: null,
      showModal: false,
      showCarteAndFurious: false,
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
        showGraph: false,
        graphData: {}
      },
      roadAccidentsLayerGroup: L.layerGroup(),
      zoomActive: false,
      geocoderMarker: L.circleMarker(),
      keepGeocoderMarker: false,
      konami: ''
    }
  },
  computed: mapState({
    contour: 'contour',
    accidents: 'accidents',
    accidentsLocal: 'accidents_geojson',
    accidentsLocalAgg: 'accidents_agg_by_road',
    dividende: 'dividende',
    divisor: 'divisor',
    localLevelDisplay: 'localLevelDisplay',
    localLevelData: 'localLevelData',
    basemapUrl: 'basemapUrl',
    hideAll: 'hideAll',
    view () {
      return this.$store.getters.view
    },
    legendScale () {
      return this.$store.getters.legendScale
    },
    colors () {
      return this.$store.getters.colors
    }
  }),
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
      if (this.localLevelDisplay === constants.AGG_BY_ROAD) {
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
      if (to.path !== from.path) {
        this.map.contextmenu.hide()
        this.removeGeocoderMarker()
        this.zoomActive = !this.keepGeocoderMarker
        this.keepGeocoderMarker = false
        this.detailedContentLayerGroup.clearLayers()
        this.roadAccidentsLayerGroup.clearLayers()
        this.$store.dispatch('set_view')
      } else {
        this.zoomActive = false
      }
    }
  },
  methods: {
    displayContours (styleFunction = null, onEachFeatureFunction = null) {
      const vm = this
      const idName = this.$store.getters.contourFilterFieldName

      const layer = L.geoJson(this.contour, {
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
      this.roadAccidentsLayerGroup.clearLayers()

      const style = {
        color: '#09006FFF',
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0
      }

      if (this.localLevelDisplay === constants.CLUSTER) {
        this.detailedContentLayerGroup.addLayer(this.createClusterLocal(constants.ACC, this.accidentsLocal))
      } else if (this.localLevelDisplay === constants.HEATMAP) {
        this.heatMap()
      } else if (this.localLevelDisplay === constants.AGG_BY_ROAD) {
        this.aggByRoad()
      }
      if (this.zoomActive && this.detailedContentLayerGroup.getBounds().isValid()) {
        this.map.fitBounds(this.detailedContentLayerGroup.getBounds())
      }
      this.displayContours(() => style, this.myOnEachFeature)
      if (this.localLevelData !== constants.ACC) {
        this.showRadars()
      }
    },
    onRoadClickAccident (event) {
      const vm = this
      const roadId = event.target.feature.properties.id
      vm.roadAccidentsLayerGroup.clearLayers()
      const previousRoadId = vm.highlightedRoadLayer ? vm.highlightedRoadLayer.feature.properties.id : undefined
      if (roadId !== previousRoadId) {
        // First click : display cluster
        event.target.setStyle({ opacity: 0.3 })
        if (vm.highlightedRoadLayer) {
          // restore previously selected road
          vm.highlightedRoadLayer.setStyle(helpers.styleAccidentsRoads(vm.highlightedRoadLayer.feature))
        }
        vm.highlightedRoadLayer = event.target
        vm.$store.dispatch('getAccidentsFromRoadId', roadId).then(function (res) {
          vm.roadAccidentsLayerGroup.addLayer(vm.createClusterLocal(constants.ACC, res))
        })
      } else {
        // Second click on same road : reset display
        event.target.setStyle(helpers.styleAccidentsRoads(event.target.feature))
        vm.highlightedRoadLayer = null
        vm.roadAccidentsLayerGroup.clearLayers()
      }
    },
    onRoadClickPve (event) {
      const vm = this
      vm.$store.dispatch('getPVEGraphData', event.target.feature.properties.id).then(function (res) {
        const aggs = res.aggregations.group_by.buckets
        const g = {
          labels: [],
          datasets: [
            {
              label: 'PVE par famille d\'infractions',
              backgroundColor: ['#FF0505', '#FFFF05', '#FF8205', '#05FFFF', '#0505FF', '#05FF82', '#FF05FF'],
              data: []
            }
          ]
        }
        for (const agg of aggs) {
          g.labels.push(agg.key)
          g.datasets[0].data.push(agg.doc_count)
        }
        vm.infoSidebarData.graphData = g
      })
      vm.infoSidebarData.showGraph = true
    },
    aggByRoad (type) {
      const vm = this

      const options = {
        [constants.ACC]: {showAcc: true, showPve: false},
        [constants.PVE]: {showAcc: false, showPve: true},
        accidentsNoPve: {showAcc: true, showPve: false},
        pveNoAccidents: {showAcc: false, showPve: true}
      }[vm.localLevelData]

      if (options.showAcc) {
        L.geoJson(this.accidentsLocalAgg, {
          style: helpers.styleAccidentsRoads,
          filter: (feature) => vm.localLevelData === constants.ACC || feature.properties.otherCount === 0,
          onEachFeature (feature, layer) {
            layer.on({
              mouseover (event) {
                layer.setStyle({ weight: 10 })
                L.popup()
                .setContent('<strong>' + feature.properties.nom_route + '</strong><br><span class="accHighlight">' + feature.properties.count + '</span> accidents')
                .setLatLng(event.latlng)
                .openOn(vm.map)
              },
              mouseout (event) {
                vm.map.closePopup()
                layer.setStyle({ weight: feature.weight })
              },
              click: vm.onRoadClickAccident
            })
          }
        }).addTo(this.detailedContentLayerGroup)
      }

      if (options.showPve) {
        L.geoJson(this.$store.state.pve_agg_by_road, {
          style: helpers.stylePveRoads,
          filter: (feature) => vm.localLevelData === constants.PVE || feature.properties.otherCount === 0,
          onEachFeature (feature, layer) {
            layer.on({
              mouseover (event) {
                layer.setStyle({ weight: 10 })
                L.popup()
                .setContent('<strong>' + feature.properties.nom_route + '</strong><br><span class="pveHighlight">' + feature.properties.count + '</span> pve')
                .setLatLng(event.latlng)
                .openOn(vm.map)
              },
              mouseout (event) {
                vm.map.closePopup()
                event.target.setStyle(helpers.stylePveRoads(event.target.feature))
              },
              click: vm.onRoadClickPve
            })
          }
        }).addTo(this.detailedContentLayerGroup)
      }
    },
    heatMap () {
      const l = this.accidentsLocal.features.map(feature => [
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
      const colorOptions = {
        color: 'rgba(0,0,0,0.2)',
        dividende: this.$store.state.dividende,
        divisor: this.$store.state.divisor
      }
      this.displayContours((feature) => this.customStyle(feature, colorOptions), this.myOnEachFeature)
      this.zoomBounds(this.contourLayerGroup.getLayers()[0])
    },
    showRadars () {
      L.geoJson(this.$store.state.radars_geojson, {
        onEachFeature: helpers.radar_popup,
        pointToLayer: helpers.radar_marker,
        style: helpers.styleAccidents
      }).addTo(this.detailedContentLayerGroup)
    },
    createClusterLocal (type, data) {
      // cluster des accidents individuels
      const datalayer = L.geoJson(data, {
        onEachFeature: helpers.accident_popup,
        pointToLayer: helpers.accident_marker,
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
      const source = {
        'accidents': this.accidents.aggregations.group_by.buckets,
        'PV électroniques': this.$store.state.verbalisations.aggregations.group_by.buckets,
        'habitants': this.contour,
        'longueur_routes': this.contour
      }

      const agg = source[type]
      if (type === 'habitants' || type === 'longueur_routes') {
        const idName = this.$store.getters.contourIdFieldName
        for (const f of agg.features) {
          if (id === f.properties[idName]) {
            return type === 'habitants' ? f.properties.population : f.properties.longueur_routes
          }
        }
      } else {
        for (const el of agg) {
          if (id === el.key) {
            return el.doc_count
          }
        }
      }
      return 0
    },
    customStyle (feature, options) {
      const idName = this.$store.getters.contourIdFieldName
      const id = feature.properties[idName]

      feature.countElements = {
        accidents: this.count('accidents', id),
        'PV électroniques': this.count('PV électroniques', id),
        habitants: this.count('habitants', id),
        longueur_routes: this.count('longueur_routes', id)
      }

      if (feature.countElements[options.dividende] || feature.countElements[options.divisor]) {
        feature.countElements.ratio = feature.countElements[options.dividende] / feature.countElements[options.divisor]
      } else {
        feature.countElements.ratio = undefined
      }

      const stripesParams = {
        spaceColor: '#000000',
        spaceOpacity: 0.8
      }
      if (feature.countElements.ratio !== undefined && !isNaN(feature.countElements.ratio)) {
        let index = this.legendScale.findIndex(s => feature.countElements.ratio > s)
        index = (index === -1) ? this.legendScale.length : index
        stripesParams.color = this.colors[index]
        stripesParams.weight = this.$store.getters.stripes[index].weight
        stripesParams.angle = this.$store.getters.stripes[index].angle
      }
      const stripes = new L.StripePattern(stripesParams).addTo(this.map)
      return {
        color: '#09006FFF',
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.5,
        fillPattern: stripes
      }
    },
    setLineWeight (weight) {
      return function (e) {
        e.target.bringToFront()
        e.target.setStyle({
          weight: weight
        })
      }
    },
    pushLinkTarget (view, geoId) {
      const route = {
        name: 'sous-carte',
        params: { view: view, id: geoId },
        query: this.$route.query
      }
      this.$router.push(route)
    },
    myOnEachFeature (feature, layer) {
      const vm = this
      const id = this.$store.getters.contourIdFieldName
      const displayName = this.$store.getters.contourDisplayFieldName

      layer.geoId = feature.properties[id]
      layer.displayName = feature.properties[displayName]
      layer.km_voie = feature.properties.longueur_routes
      if (vm.view.content !== 'detailedContent' || vm.view.data.filter.value !== layer.geoId) {
        // disable mouseover effect on the current administrative shape when displaying detailedContent
        layer.on({
          mouseover: this.setLineWeight(3),
          mouseout: this.setLineWeight(0.5)
        })
        layer.on('click', function (e) {
          // by default, links to the first available view
          if (!vm.freezeInteractions) {
            vm.freezeInteractions = true
            setTimeout(function () { vm.freezeInteractions = false }, 300)
            if (L.Browser.mobile) {
              mobileTimeout = setTimeout(function () { vm.pushLinkTarget(vm.view.linksTo[0].view, layer.geoId) }, 300)
            } else {
              vm.pushLinkTarget(vm.view.linksTo[0].view, layer.geoId)
            }
          } else {
            if (L.Browser.mobile) {
              // on mobile, a double tap will not trigger a navigation
              clearTimeout(mobileTimeout)
            }
          }
        })
      }

      layer.on('contextmenu', function (e) {
        // on right click, you can choose which view to link to.
        vm.map.contextmenu.removeAllItems()
        if (vm.view.linksTo.length > 1) {
          for (const link of vm.view.linksTo) {
            vm.map.contextmenu.addItem({ text: link.text, callback: (e) => vm.pushLinkTarget(link.view, layer.geoId) })
          }
        }
      })

      this.linkHoverInfoToLayer(feature, layer)
    },
    linkHoverInfoToLayer (feature, layer) {
      const vm = this
      layer.on('mouseover', function (e) {
        vm.infoSidebarData.hoverInfoData.areaMouseOver = layer.displayName
        vm.infoSidebarData.hoverInfoData.ratio = feature.countElements ? feature.countElements.ratio : ''
        vm.infoSidebarData.hoverInfoData.accidentsN = feature.countElements ? feature.countElements.accidents : ''
        vm.infoSidebarData.hoverInfoData.pveN = feature.countElements ? feature.countElements['PV électroniques'] : ''
        vm.infoSidebarData.hoverInfoData.km_voie = layer.km_voie
      })
    },
    removeGeocoderMarker () {
      if (this.geocoderMarker && !this.keepGeocoderMarker) { this.geocoderMarker.remove() }
    },
    markGeocode (f) {
      this.keepGeocoderMarker = false
      this.removeGeocoderMarker()
      const latlng = [f.geometry.coordinates[1], f.geometry.coordinates[0]]
      this.map.setView(latlng, 16)
      var popup = L.popup()
        .setLatLng(latlng)
        .setContent(f.properties.label)
        .openOn(this.map)
      this.geocoderMarker = L.circleMarker(latlng, {
        contextmenu: true,
        contextmenuItems: [{
          text: 'supprimer',
          callback: () => this.geocoderMarker.remove()
        }]
      }).bindPopup(popup).addTo(this.map)
      this.keepGeocoderMarker = true
      this.pushLinkTarget('département', f.properties.citycode.substring(0, 2).toUpperCase())
    }
  },
  created () {
    if (this.$route.query.digest && this.$route.query.digest !== this.$store.getters.configDigest) {
      this.showModal = true
    }
  },
  mounted () {
    const vm = this

    this.map = L.map('map2', {
      zoomControl: false,
      contextmenu: true,
      contextmenuWidth: 160
    })
    .setView([45.853459, 2.349312], 6)

    L.control.sidebar('sidebar').addTo(this.map)

    let geocoder = L.geocoderBAN({ collapsed: false, autofocus: !L.Browser.mobile }).addTo(this.map)
    geocoder.markGeocode = this.markGeocode

    const zoomControl = L.control.zoom().addTo(vm.map)

    this.tileLayer = L.tileLayer(this.basemapUrl, {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 18
    }).addTo(this.map)

    this.tileLayer
      .on('tileerror', function () {
        // fallback is tile server cannot be reached
        tileErrorCount++
        if (tileErrorCount > 10) {
          vm.$store.commit('set_basemapUrl', 'http://osm.psi.minint.fr/{z}/{x}/{y}.png')
        }
      })
      .on('tileloadstart ', function () {
        // avoid switching to backup tile server on a single error
        tileErrorCount = 0
      })

    keyboardJS.bind('e+s+c', function (e) {
      window.open(`${process.env.ES_HOST}/_cat/indices/${process.env.indices.acc},${process.env.indices.pve}`, '_blank')
    })

    keyboardJS.bind('alt+p', function (e) {
      // permet la Copie d'Écran
      vm.$store.commit('toggle_hide_all')
      if (vm.hideAll) {
        zoomControl.remove()
      } else {
        zoomControl.addTo(vm.map)
      }
    })

    keyboardJS.bind('', function (e) {
      vm.konami = (vm.konami + e.keyCode).slice(-20)
      if (vm.konami === '38384040373937396665') {
        vm.showCarteAndFurious = true
        vm.$store.commit('set_basemapUrl', 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png')
      }
    })

    const setMapViewInUrl = function () {
      if (vm.$store.getters.localLevel) {
        const query = Object.assign({}, vm.$route.query)
        query.zoom = vm.map.getZoom()
        query.center = vm.map.getCenter().lat + ',' + vm.map.getCenter().lng
        vm.$router.replace({query: query})
      }
    }

    this.map.on('zoomend', setMapViewInUrl)
    this.map.on('moveend', setMapViewInUrl)

    this.map.addLayer(this.contourLayerGroup)
    this.map.addLayer(this.detailedContentLayerGroup)
    this.map.addLayer(this.roadAccidentsLayerGroup)

    if (this.$route.query && this.$route.query.center && this.$route.query.zoom) {
      this.zoomActive = false
      this.$store.dispatch('set_view')
      this.map.setView(this.$route.query.center.split(','), this.$route.query.zoom)
    } else {
      this.zoomActive = true
      this.$store.dispatch('set_view')
    }

    // avoid clicking and scrolling when the mouse is over the div
    const div = L.DomUtil.get('info-sidebar')
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
