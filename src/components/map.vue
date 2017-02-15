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
import _ from 'lodash'

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

let map
let layerGroup = L.layerGroup()

export default {
  data () {
    return {
      clusters: es.getFieldsMap()
    }
  },
  computed: {
    level () {
      return this.$store.state.level
    },
    accidents () {
      return this.$store.state.accidents
    },
    verbalisations () {
      return this.$store.state.verbalisations
    }
  },
  watch: {
    level () {
      layerGroup.clearLayers()
      layerGroup.addLayer(this.createCluster('acc', this.level, this.$store.state.parent.id))
      layerGroup.addLayer(this.createCluster('pve', this.level, this.$store.state.parent.id))
    },
    accidents () {
      this.display(this.accidents, 'acc')
    },
    verbalisations () {
      this.display(this.verbalisations, 'pve')
    }
  },
  methods: {
    getCluster (type, level) {
      return this.clusters[type][level]
    },
    display (resp, type) {
      let level = this.level
      let cluster = this.getCluster(type, level)
      let agg = resp.aggregations.group_by.buckets
      let n = agg.length

      cluster.eachLayer((layer) => {
        let found = false
        for (var i = 0; i < n; ++i) {
          if (layer.geoName === agg[i].key) {
            layer.count = agg[i].doc_count
            found = true
            break
          }
        }
        if (!found) { layer.count = 0 }
      })
      cluster.refreshClusters()
    },
    clusterIconCreateFunctionWithClass (cluster, Additionalclass) {
      // Fonction personnalisée de création des icones de clusters
      // Additionalclass permet de passer une customization via le css
      let childMarkers = cluster.getAllChildMarkers()
      let n = _(childMarkers).map(c => c.count).sum()

      let c = ' '
      /*
      if (this.level === 'departement') {
        let parentId = this.$store.state.parent.id
        c += _.includes(childMarkers.map(c => c.parentGeoId), parentId) ? '' : 'hidden '
      } */

      c += 'marker-cluster-'
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
    },
    clusterIconCreateFunction (cluster) {
      return this.clusterIconCreateFunctionWithClass(cluster, 'cluster-acc marker-cluster')
    },
    clusterIconCreateFunctionOffset (cluster) {
      return this.clusterIconCreateFunctionWithClass(cluster, 'cluster-pve cluster-offset marker-cluster')
    },
    createCluster (type, level, filter) {
      let iconCreateFunction = type === 'acc' ? this.clusterIconCreateFunction : this.clusterIconCreateFunctionOffset
      let geoName = level === 'region' ? 'NOM_REG' : 'CODE_DEPT'
      let geoId = level === 'region' ? 'CODE_REG' : 'CODE_DEPT'
      let parentGeoId = level === 'region' ? '' : 'CODE_REG'
      let geoJson = level === 'region' ? regions : departements

      let cluster = L.markerClusterGroup({
        iconCreateFunction: iconCreateFunction,
        singleMarkerMode: true,
        maxClusterRadius: 40
      }).addLayer(L.geoJson(geoJson, {
        onEachFeature (feature, layer) {
          layer.geoName = feature.properties[geoName]
          layer.geoId = feature.properties[geoId]
          layer.parentGeoId = feature.properties[parentGeoId]
          layer.count = 0
        },
        filter (feature, layer) {
          if (filter) {
            return feature.properties[parentGeoId] === filter
          } else {
            return true
          }
        }
      })
      )
      // console.log(type)
      // console.log(this.clusters[type]['region'])
      this.clusters[type][level] = cluster

      return cluster
    },
    createClusters () {
      // clusters = es.getFieldsMap()
      for (let typeName in this.clusters) {
        let type = this.clusters[typeName]
        for (let levelName in type) {
          this.clusters[typeName][levelName] = L.markerClusterGroup({
            iconCreateFunction: typeName === 'acc'
              ? this.clusterIconCreateFunction
              : this.clusterIconCreateFunctionOffset,
            singleMarkerMode: true,
            maxClusterRadius: 40
          }).addLayer(levelName === 'region'
            ? L.geoJson(regions, {
              onEachFeature (feature, layer) {
                layer.geoName = feature.properties.NOM_REG
                layer.geoId = feature.properties.CODE_REG
                layer.count = 0
              }
            })
            : L.geoJson(departements, {
              onEachFeature (feature, layer) {
                layer.geoName = feature.properties.CODE_DEPT
                layer.count = 0
                layer.parentGeoId = feature.properties.CODE_REG
              }
            })
          )
        }
      }
    }
  },
  mounted () {
    map = L.map('map2', {
      zoomControl: false
    }).setView([45.853459, 2.349312], 6)

    L.tileLayer(' http://osm.psi.minint.fr/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 18
    }).addTo(map)

    // this.createClusters()
    let level = this.$store.state.level
    this.createCluster('acc', level)
    this.createCluster('pve', level)
    // this.createCluster('pve', level)
    layerGroup.addLayer(this.getCluster('acc', level))
    layerGroup.addLayer(this.getCluster('pve', level))

    // layerGroup.addLayer(this.createCluster('acc', level))
    // layerGroup.addLayer(this.createCluster('pve', level))
    map.addLayer(layerGroup)

    let vm = this
    this.getCluster('acc', 'region').eachLayer(function (layer) {
      layer.on('click', function () {
        vm.$store.dispatch('set_level', {level: 'departement', parentLevel: 'region', parentName: layer.geoName, parentId: layer.geoId})
      })
    })
    this.getCluster('pve', 'region').eachLayer(function (layer) {
      layer.on('click', function () {
        vm.$store.dispatch('set_level', {level: 'departement', parentLevel: 'region', parentName: layer.geoName, parentId: layer.geoId})
      })
    })

    map.on('zoomend', (e) => {
      if (map.getZoom() < 4) {
        this.$store.dispatch('set_level', {level: 'region'})
      }
    })
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