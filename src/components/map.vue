<template>
    <div id="map2">
    </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet.markercluster'
import '../../node_modules/leaflet/dist/leaflet.css'
import '../../node_modules/leaflet.markercluster/dist/MarkerCluster.css'
import _ from 'lodash'
import test from './test'

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

export default {
  components: {
    test: test
  },
  data () {
    return {
      map: null,
      layerGroup: L.layerGroup(),
      clusters: {
        'Pve': null,
        'Acc': null
      },
      cluster_Acc: null,
      cluster_Pve: null,
      levelsInfos: {
        region: {
          parent: '',
          child: 'departement',
          geoName: 'NOM_REG',
          geoId: 'CODE_REG',
          parentGeoId: ''

        },
        departement: {
          parent: 'region',
          child: 'commune',
          geoName: 'CODE_DEPT',
          geoId: 'CODE_DEPT',
          parentGeoId: 'CODE_REG'
        },
        commune: {
          parent: 'departement',
          child: '',
          geoName: 'CodeINSEE',
          geoId: 'CodeINSEE',
          parentGeoId: 'CodeDepartement'
        }
      }
    }
  },
  computed: {
    level () {
      return this.$store.state.level
    },
    level_geojson () {
      return this.$store.state.level_geojson
    },
    accidents () {
      return this.$store.state.accidents
    },
    verbalisations () {
      return this.$store.state.verbalisations
    },
    criteria_list () {
      return this.$store.state.criteria_list
    }
  },
  watch: {
    level () {
    },
    level_geojson () {
      console.log('nouveau geojson chargé !')
      this.layerGroup.clearLayers()
      this.createCluster('acc', this.level, this.$store.state.parent.id)
      this.createCluster('pve', this.level, this.$store.state.parent.id)

      this.clusters['acc'] = this.cluster_Acc
      this.layerGroup.addLayer(this.cluster_Acc)
      this.addClusterActions('acc')
      this.map.fitBounds(this.cluster_Acc.getBounds())

      this.clusters['pve'] = this.cluster_Pve
      this.layerGroup.addLayer(this.cluster_Pve)
      this.addClusterActions('pve')
    },
    accidents () {
      this.updateClusterValues(this.accidents, 'acc')
    },
    verbalisations () {
      this.updateClusterValues(this.verbalisations, 'pve')
    }
  },
  methods: {
    setCluster (type, cluster) {
      if (type === 'acc') {
        this.cluster_Acc = cluster
      } else if (type === 'pve') {
        this.cluster_Pve = cluster
      }
    },
    getCluster (type) {
      return this.clusters[type]
    },
    updateClusterValues (resp, type) {
      // console.log('tentative de updateClusterValues')
      let cluster = this.getCluster(type)
      let agg = resp.aggregations.group_by.buckets
      let n = agg.length

      /*
      if (this.level === 'commune' && type === 'acc') {
        console.log(agg)
      } */

      cluster.eachLayer((layer) => {
        /* if (this.level === 'commune' && type === 'acc') {
          console.log(layer.geoName)
        } */
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
    addClustersActions () {
      this.addClusterActions('acc')
      this.addClusterActions('pve')
    },
    addClusterActions (type) {
      let vm = this
      this.clusters[type].eachLayer(function (layer) {
        layer.on('click', function () {
          vm.$store.dispatch('set_level', {level: vm.levelsInfos[vm.level].child, parentLevel: vm.level, parentName: layer.geoName, parentId: layer.geoId})
        })
      })
    },
    clusterIconCreateFunctionWithClass (cluster, Additionalclass) {
      // Fonction personnalisée de création des icones de clusters
      // Additionalclass permet de passer une customization via le css
      let childMarkers = cluster.getAllChildMarkers()
      let n = _(childMarkers).map(c => c.count).sum()

      let c = ' '
      c += 'marker-cluster-'
      if (n === 0) {
        c += 'empty'
      } else if (n < 10000) {
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

      let geoName = this.levelsInfos[level].geoName
      let geoId = this.levelsInfos[level].geoId
      let parentGeoId = this.levelsInfos[level].parentGeoId

      let cluster = L.markerClusterGroup({
        iconCreateFunction: iconCreateFunction,
        singleMarkerMode: true,
        maxClusterRadius: 40
      }).addLayer(L.geoJson(this.level_geojson, {
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
      }))
      this.setCluster(type, cluster)
    }
  },
  mounted () {
    this.map = L.map('map2', {zoomControl: false}).setView([45.853459, 2.349312], 6)

    L.tileLayer(' http://osm.psi.minint.fr/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 18
    }).addTo(this.map)

    this.map.addLayer(this.layerGroup)
    this.$store.dispatch('set_level', {level: 'region'})

    this.map.on('zoomend', (e) => {
      if (this.map.getZoom() < 6) {
        this.$store.dispatch('set_level', {level: 'region'})
      }
    })
    /*
    $.getJSON('http://10.237.27.129/data/communes/' + '75' + '/communes.geojson', function (geojson) {
      vm.layerGroup.addLayer(L.geoJson(geojson, {
        style (feature) {
          return {
            color: 'black',
            weight: 1,
            fillOpacity: 0
          }
        }
      }))
    }) */
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
.cluster-acc.marker-cluster-empty {
    background-color: rgba(226, 118, 29, 0.3);
}
.cluster-acc.marker-cluster-empty div {
    background-color: rgba(226, 118, 29, 0.3);
}
.cluster-acc.marker-cluster-small {
    background-color: rgba(226, 118, 29, 0.8);
}
.cluster-acc.marker-cluster-small div {
    background-color: rgba(226, 118, 29, 0.8);
}
.cluster-acc.marker-cluster-medium {
    background-color: rgba(241, 77, 27, 0.8);
}
.cluster-acc.marker-cluster-medium div {
    background-color: rgba(241, 77, 27, 0.8);
}

.cluster-acc.marker-cluster-large {
    background-color: rgba(253, 32, 32, 0.8);
}
.cluster-acc.marker-cluster-large div {
    background-color: rgba(253, 32, 32, 1.0);
}


/*PVE*/
.cluster-pve.marker-cluster-empty {
    background-color: rgba(131, 133, 226, 0.3);
}
.cluster-pve.marker-cluster-empty div {
    background-color: rgba(131, 133, 226, 0.3);
}
.cluster-pve.marker-cluster-small {
    background-color: rgba(131, 133, 226, 0.8);
}
.cluster-pve.marker-cluster-small div {
    background-color: rgba(131, 133, 226, 0.8);
}

.cluster-pve.marker-cluster-medium {
    background-color: rgba(74, 74, 241, 0.8);
}
.cluster-pve.marker-cluster-medium div {
    background-color: rgba(74, 74, 241, 0.8);
}

.cluster-pve.marker-cluster-large {
    background-color: rgba(9, 9, 253, 0.8);
}
.cluster-pve.marker-cluster-large div {
    background-color: rgba(9, 9, 253, 0.8);
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
    color: white;
}
.marker-cluster span {
    line-height: 30px;
}
</style>