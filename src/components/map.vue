<template>
    <div id="map2">
        <legende :data="legendData"></legende>
    </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet.markercluster'
import '../../node_modules/leaflet/dist/leaflet.css'
import '../../node_modules/leaflet.markercluster/dist/MarkerCluster.css'
import '../../node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css'
// import _ from 'lodash'
import '../../node_modules/sidebar-v2/js/leaflet-sidebar.js'
import es from '../store/modules/elastic_search'
import '../../node_modules/font-awesome/css/font-awesome.min.css'
// require('font-awesome/css/font-awesome.min.css')
// import 'font-awesome'
import legend from './legend'

function styleAccidents (feature) {
  return {
    opacity: 0,
    fillOpacity: 0
  }
}

let vehiculesIcons = {
  '_catv_voiture_nb': 'car',
  '_catv_utilitaire_nb': 'car',
  '_catv_deuxrouesmotorises_nb': 'motorcycle',
  '_catv_velo_nb': 'bicycle',
  '_catv_poidslourd_nb': 'truck',
  '_catv_vehiculeautre_nb': 'car',
  '_catv_pietons_nb': 'male'
}

let levelsInfos = {
  région: {
    parent: '',
    child: 'département',
    id: 'NOM_REG',
    name: 'NOM_REG'

  },
  département: {
    parent: 'région',
    child: 'commune',
    id: 'CODE_DEPT',
    name: 'NOM_DEPT'
  },
  commune: {
    parent: 'département',
    child: 'local',
    id: 'code',
    name: 'nom'
  },
  local: {
    parent: 'commune',
    child: '',
    id: '',
    name: ''
  }
}

export default {
  components: {
    legende: legend
  },
  data () {
    return {
      map: null,
      frontiersGroup: L.layerGroup(),
      geojsonFrontieres: null,
      clusterGroup: L.layerGroup(),
      cluster_Acc: null,
      geojsonAcc: null,
      legendData: {
        areaMouseOver: '',
        ratio: '',
        accidentsN: '',
        pveN: ''
      },
      levelsInfos: levelsInfos
    }
  },
  computed: {
    level () {
      return this.$store.state.level
    },
    level_geojson () {
      return this.$store.state.level_geojson
    },
    level_shape_geojson () {
      return this.$store.state.level_shape_geojson
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
    dividende () {
      return this.$store.state.dividende
    },
    divisor () {
      return this.$store.state.divisor
    }
  },
  watch: {
    dividende () {
      this.colorMap()
    },
    divisor () {
      this.colorMap()
    },
    accidents () {
      this.colorMap()
    },
    accidentsLocal () {
      // console.log(JSON.stringify(this.accidents_geojson))
      let vm = this
      this.clusterGroup.clearLayers()
      this.geojsonFrontieres.setStyle({
        fillOpacity: 0.1,
        fillColor: 'black'})

      this.geojsonFrontieres.eachLayer(function (layer) {
        layer.removeEventListener('mouseover')
        layer.removeEventListener('mouseout')
        if (layer.geoId !== vm.$store.state.parent.id) {
          layer.on({
            mouseover: vm.setOpacity(0.3),
            mouseout: vm.setOpacity(0.1)
          })
        } else if (layer.getBounds().isValid()) {
          vm.map.fitBounds(layer.getBounds())
        }
      })

      this.createClusterLocal('acc')
      this.clusterGroup.addLayer(this.cluster_Acc)
    }
  },
  methods: {
    colorMap () {
      this.frontiersGroup.clearLayers()
      let filter = this.level === 'département' ? this.$store.state.parent.id : ''
      let colorOptions = { color: 'blue', dividende: this.$store.state.dividende, divisor: this.$store.state.divisor }
      this.add_contours_geojson(filter, this.setStyle(colorOptions), this.myOnEachFeature)
      if (this.level !== 'région' && this.geojsonFrontieres.getBounds().isValid()) {
        this.map.fitBounds(this.geojsonFrontieres.getBounds())
      }
    },
    setCluster (type, cluster) {
      if (type === 'acc') {
        this.cluster_Acc = cluster
      } else if (type === 'pve') {
        this.cluster_Pve = cluster
      }
    },
    add_contours_geojson (filter, styleFunction, onEachFeatureFunction) {
      let parentLevel = this.levelsInfos[this.level].parent
      let parentId = parentLevel ? this.levelsInfos[parentLevel].id : ''

      this.geojsonFrontieres = L.geoJson(this.level_shape_geojson, {
        style: styleFunction,
        onEachFeature: onEachFeatureFunction,
        filter (feature, layer) {
          if (filter) {
            return feature.properties[parentId] === filter
          } else {
            return true
          }
        }
      })
      this.frontiersGroup.addLayer(this.geojsonFrontieres)
    },
    createClusterLocal (type) {
      // cluster des accidents individuels
      this.geojsonAcc = L.geoJson(this.accidentsLocal, {
        onEachFeature: function (feature, layer) {
          layer.bindPopup()
          layer.on({
            click: function () {
              console.log('click!')
              let content = '<i class="fa fa-info-circle" aria-hidden="true"></i></br>'
              for (let p in feature.properties) {
                if (!p.startsWith('_catv_')) {
                  content += p + ': ' + feature.properties[p] + '</br>'
                }
              }
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
          return L.circleMarker(latlng, null).bindTooltip(content, {permanent: true, direction: 'center'})
        },
        style: styleAccidents
      })
      let cluster = L.markerClusterGroup({
        maxClusterRadius: 30,
        singleMarkerMode: false
        // iconCreateFunction: accidentIconCreateFunction
        // spiderfyDistanceMultiplier: 1
      }).addLayer(this.geojsonAcc)
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
        'habitants': this.level_shape_geojson
      }

      if (type === 'habitants') {
        let idName = this.levelsInfos[this.level].id
        // console.log(source[type])
        let res
        for (let f of source[type].features) {
          // console.log(f)
          if (id === f.properties[idName]) {
            res = f.properties.population
            break
          }
        }
        return res
      } else {
        let agg = source[type]
        let res
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
      let idName = this.levelsInfos[this.level].id
      let id = feature.properties[idName]

      feature.countElements = {}
      feature.countElements.accidents = this.count('accidents', id)
      feature.countElements.PVE = this.count('PVE', id)
      feature.countElements.habitants = this.count('habitants', id)
      feature.countElements.ratioLegend = 'Nombre de ' + options.dividende + ' par ' + options.divisor

      // console.log(feature.countElements.pop)

      if (feature.countElements[options.dividende] && feature.countElements[options.divisor]) {
        feature.countElements.ratio = feature.countElements[options.dividende] / feature.countElements[options.divisor]
      }

      let fillColor = options.color
      let fillOpacity = 0.3
      if (feature.countElements.ratio) {
        let c = this.$store.getters.countElements
        let avg = c[options.dividende] / c[options.divisor]
        console.log(avg)
        if (feature.countElements.ratio > 1.1 * avg) {
          fillOpacity = 0.3
          fillColor = '#2EFF00'
        } else if (feature.countElements.ratio > 1.0 * avg) {
          fillOpacity = 0.3
          fillColor = '#BBFF00'
        } else if (feature.countElements.ratio > 0.9 * avg) {
          fillOpacity = 0.3
          fillColor = '#FFB700'
        } else {
          fillOpacity = 0.3
          fillColor = '#FF4901'
        }
      }
      return {
        color: 'white',
        weight: 1,
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
    myOnEachFeature (feature, layer) {
      let vm = this
      let id = this.levelsInfos[this.level].id
      let parentLevel = this.levelsInfos[this.level].parent
      let parentId = parentLevel ? this.levelsInfos[parentLevel].id : ''
      let displayName = this.levelsInfos[this.level].name

      layer.on({
        mouseover: vm.setOpacity(0.6),
        mouseout: vm.setOpacity(0.3)
      })
      layer.geoId = feature.properties[id]
      layer.parentId = parentId ? feature.properties[parentId] : ''
      layer.displayName = feature.properties[displayName]
      layer.level = this.level

      layer.on('mouseover', function (e) {
        vm.legendData.areaMouseOver = layer.displayName
        vm.legendData.ratio = feature.countElements.ratio
        vm.legendData.accidentsN = feature.countElements.accidents
        vm.legendData.pveN = feature.countElements.PVE
        vm.legendData.ratioLegend = feature.countElements.ratioLegend
      })
      if (vm.level !== 'local') {
        layer.on('click', function () {
          vm.map.closePopup()
          vm.$store.dispatch('set_level', {level: vm.levelsInfos[layer.level].child, parentLevel: layer.level, parentName: layer.displayName, parentId: layer.geoId})
        })
      }
    }
  },
  mounted () {
    this.map = L.map('map2', {zoomControl: false}).setView([45.853459, 2.349312], 6)
    L.control.sidebar('sidebar').addTo(this.map)

    L.tileLayer(' http://osm.psi.minint.fr/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 18
    }).addTo(this.map)

    this.map.addLayer(this.frontiersGroup)
    this.map.addLayer(this.clusterGroup)
    this.$store.dispatch('set_level', {level: 'région'})

    this.map.on('zoomend', (e) => {
      if (this.map.getZoom() < 6) {
        this.$store.dispatch('set_level', {level: 'région'})
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
    margin-top: 0px !important;
}
/*ACCIDENTS*/
.cluster-acc.marker-cluster {
    background-color: rgba(186, 186, 186, 0.0);
}
.cluster-acc.marker-cluster div{
    background-color: rgba(186, 186, 186, 0.0);
    color: white;
    font-weight: bold;
    font-size: 16px;
    text-shadow: 0px 0px 6px black;
}

/*PVE*/
.cluster-pve.marker-cluster {
    background-color: rgba(186, 186, 186, 0.0);
}
.cluster-pve.marker-cluster div{
    background-color: rgba(186, 186, 186, 0.0);
    color: white;
    font-weight: bold;
    font-size: 16px;
    text-shadow: 0px 0px 4px black;
}
.marker-cluster {
    background-clip: padding-box;
}
.marker-cluster span {
    line-height: 30px;
}
.leaflet-tooltip {
  background-color: rgba(255, 0, 0, 0.7) !important;
  border-style: none !important;
  padding: 1px !important;
}
.leaflet-tooltip > i {
  color: white;
}
</style>