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

var markersPve = L.markerClusterGroup({
  // Création du cluster des verbalisations
  iconCreateFunction: clusterIconCreateFunctionOffset,
  singleMarkerMode: true
})

var markersAcc = L.markerClusterGroup({
  // Création du cluster des accidents
  iconCreateFunction: clusterIconCreateFunction,
  singleMarkerMode: true
})

export default {
  mounted () {
    var map = L.map('map2', {
      zoomControl: false
    }).setView([45.853459, 2.349312], 6)

    L.tileLayer(' http://osm.psi.minint.fr/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 18
    }).addTo(map)

    var prefectures = L.geoJson(departements, {
      onEachFeature (feature, layer) {
        layer.dep = feature.properties.CODE_DEPT
        layer.count = 0
      }
    })

    markersAcc.addLayer(prefectures)
    map.addLayer(markersAcc)

    var PVE = L.geoJson(departements, {
      onEachFeature (feature, layer) {
        layer.dep = feature.properties.CODE_DEPT
        layer.count = 0
      }
    })

    map.on('zoomend', (e) => {
      if (map.getZoom() > 10) {
        this.$store.dispatch('set_level', 'departement')
      } else {
        this.$store.dispatch('set_level', 'region')
      }
    })

    markersPve.addLayer(PVE)
    map.addLayer(markersPve)

    /* markers_pve.eachLayer(function(layer) {
      layer.on('click', function() {
        if (map.hasLayer(communes_boundaries)) {
          map.removeLayer(communes_boundaries)
        }
        //$.getJSON("../../data/communes/" + layer.dep + "/communes.geojson", function(geojson) {
        $.getJSON("http://10.237.27.129/data/communes/" + layer.dep + "/communes.geojson", function(geojson) {

            communes_boundaries = new L.geoJson(geojson, {
                style: function(feature) {
                    return {
                        color: "black",
                        weight: 1.,
                        fillOpacity: 0.
                     }
                }
            })
            communes_boundaries.addTo(map)
            map.fitBounds(communes_boundaries.getBounds())
          })
      })
    }) */
  },
  actions: {
    level_changed (context, level) {
      console.log('Il faut faire un truc maintenant !')
    },
    display (context, response) {
      let resp = response.response
      let type = response.type

      let cluster
      if (type === 'pve') {
        cluster = markersPve
      } else {
        cluster = markersAcc
      }

      let agg = resp.aggregations.group_by_dep.buckets
      let n = agg.length
      if (n === 0) {
        cluster.eachLayer((layer) => {
          layer.count = 0
        })
      }
      for (var i = 0; i < n; ++i) {
        let esKey = agg[i].key
        let count = agg[i].doc_count
        cluster.eachLayer((layer) => {
          if (layer.dep === esKey) {
            layer.count = count
          }
        })
      }
      cluster.refreshClusters()
    }
  }
}
</script>

<style>
#map2 {
    height: 100%;
    width: 80%;
    float: right;
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