<template>
    <div id="map2">
    </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet.markercluster'
import '../../node_modules/leaflet/dist/leaflet.css'
import '../../node_modules/leaflet.markercluster/dist/MarkerCluster.css'
import departements from '../assets/json/departements_wgs84.json'
import regions from '../assets/json/regions_nouvelles_wgs84.json'
import es from '../store/modules/elastic_search'

function niceDisplay (n) {
  // Gère l'affichage des nombres dans les clusters
  if (n > 1000000) {
    n = Math.round(n / 10000) / 100 + 'm'
  }
  if (n > 10000) {
    n = Math.round(n / 1000) + 'k'
  } else if (n > 1000) {
    n = Math.round(n / 100) / 10 + 'k'
  }
  return n
}

function clusterIconCreateFunctionWithClass (cluster, Additionalclass) {
  // Fonction personnalisée de création des icones de clusters
  // Additionalclass permet de passer une customization via le css
  let childMarkers = cluster.getAllChildMarkers()
  let n = 0
  for (let i = 0; i < childMarkers.length; i++) {
    n += childMarkers[i].count
  }
  let c = ' marker-cluster-'
  if (n < 10000) {
    c += 'small'
  } else if (n < 50000) {
    c += 'medium'
  } else {
    c += 'large'
  }
  n = niceDisplay(n)
  return new L.DivIcon({
    html: '<div><span>' + n + '</span></div>',
    className: Additionalclass + c,
    iconSize: new L.Point(40, 40)
  })
}

function clusterIconCreateFunction (cluster) {
  return clusterIconCreateFunctionWithClass(cluster, 'cluster-acc marker-cluster')
}

function clusterIconCreateFunctionOffset (cluster) {
  return clusterIconCreateFunctionWithClass(cluster, 'cluster-pve cluster-offset marker-cluster')
}

let clusters = {}
let map
let layerGroup = L.layerGroup()

function createClusters () {
  clusters = es.getFieldsMap()
  for (let typeName in clusters) {
    let type = clusters[typeName]
    for (let levelName in type) {
      clusters[typeName][levelName] = L.markerClusterGroup({
        iconCreateFunction: typeName === 'acc'
          ? clusterIconCreateFunction
          : clusterIconCreateFunctionOffset,
        singleMarkerMode: true
      }).addLayer(levelName === 'region'
        ? L.geoJson(regions, {
          onEachFeature (feature, layer) {
            layer.name = feature.properties.NOM_REG
            layer.count = 0
          }
        })
        : L.geoJson(departements, {
          onEachFeature (feature, layer) {
            layer.name = feature.properties.CODE_DEPT
            layer.count = 0
          }
        })
      )
    }
  }
}

function getCluster (type, level) {
  return clusters[type][level]
}

export default {
  data () {
    return {}
  },
  computed: {
    get_level () {
      return this.$store.getters.get_level
    }
  },
  methods: {
  },
  mounted () {
    map = L.map('map2', {
      zoomControl: false
    }).setView([45.853459, 2.349312], 6)

    L.tileLayer(' http://osm.psi.minint.fr/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 18
    }).addTo(map)

    createClusters()
    let level = this.$store.getters.get_level
    layerGroup.addLayer(getCluster('acc', level))
    layerGroup.addLayer(getCluster('pve', level))
    map.addLayer(layerGroup)

    let vm = this
    getCluster('acc', 'region').eachLayer(function (layer) {
      layer.on('click', function () {
        vm.$store.dispatch('set_level', {level: 'departement', parentLevel: 'region', parentName: layer.name})
      })
    })
    getCluster('pve', 'region').eachLayer(function (layer) {
      layer.on('click', function () {
        vm.$store.dispatch('set_level', {level: 'departement', parentLevel: 'region', parentName: layer.name})
      })
    })

    map.on('zoomend', (e) => {
      if (map.getZoom() < 8) {
        this.$store.dispatch('set_level', {level: 'region'})
      }
    })
  },
  actions: {
    level_changed (context, level) {
      layerGroup.clearLayers()
      layerGroup.addLayer(getCluster('acc', level))
      layerGroup.addLayer(getCluster('pve', level))
    },
    display (context, response) {
      let resp = response.response
      let type = response.type
      let level = context.getters.get_level
      let cluster = getCluster(type, level)
      let agg = resp.aggregations.group_by.buckets
      let n = agg.length

      cluster.eachLayer((layer) => {
        let found = false
        for (var i = 0; i < n; ++i) {
          if (layer.name === agg[i].key) {
            layer.count = agg[i].doc_count
            found = true
            break
          }
        }
        if (!found) { layer.count = 0 }
      })
      cluster.refreshClusters()
    }
  }
}
</script>

<style>
#map2 {
     height: 100%;
     width: auto;
}

.cluster-offset.marker-cluster {
    margin-left: 20px !important;
}

/*ACCIDENTS*/
.cluster-acc.marker-cluster-small {
    background-color: rgba(226, 152, 152, 0.6);
}
.cluster-acc.marker-cluster-small div {
    background-color: rgba(226, 152, 152, 0.6);
}

.cluster-acc.marker-cluster-medium {
    background-color: rgba(241, 95, 95, 0.6);
}
.cluster-acc.marker-cluster-medium div {
    background-color: rgba(241, 95, 95, 0.6);
}

.cluster-acc.marker-cluster-large {
    background-color: rgba(253, 32, 32, 0.6);
}
.cluster-acc.marker-cluster-large div {
    background-color: rgba(253, 32, 32, 0.6);
}


/*PVE*/
.cluster-pve.marker-cluster-small {
    background-color: rgba(131, 133, 226, 0.4);
}
.cluster-pve.marker-cluster-small div {
    background-color: rgba(131, 133, 226, 0.4);
}

.cluster-pve.marker-cluster-medium {
    background-color: rgba(74, 74, 241, 0.4);
}
.cluster-pve.marker-cluster-medium div {
    background-color: rgba(74, 74, 241, 0.4);
}

.cluster-pve.marker-cluster-large {
    background-color: rgba(9, 9, 253, 0.4);
}
.cluster-pve.marker-cluster-large div {
    background-color: rgba(9, 9, 253, 0.4);
}


.marker-cluster {
    background-clip: padding-box;
    border-radius: 20px;
}
.marker-cluster div {
    width: 30px;
    height: 30px;
    margin-left: 5px;
    margin-top: 5px;

    text-align: center;
    border-radius: 15px;
    font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
}
.marker-cluster span {
    line-height: 30px;
}
</style>