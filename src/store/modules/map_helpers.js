import L from 'leaflet'
import es from './elastic_search'

let vehiculesIcons = {
  _catv_voiture_nb: 'car',
  _catv_utilitaire_nb: 'car',
  _catv_deuxrouesmotorises_nb: 'motorcycle',
  _catv_velo_nb: 'bicycle',
  _catv_poidslourd_nb: 'truck',
  _catv_vehiculeautre_nb: 'car',
  _catv_pietons_nb: 'male'
}

export default {
  styleAccidents (feature) {
    return {
      opacity: 0,
      fillOpacity: 0
    }
  },
  styleAccidentsRoads (feature) {
    let count = feature.properties.count
    let values = [
      {count: 2, weight: 2, opacity: 0.5},
      {count: 4, weight: 3, opacity: 0.7},
      {count: 5, weight: 4, opacity: 0.8},
      {count: Number.MAX_VALUE, weight: 6, opacity: 1}
    ].find(x => x.count > count)

    return {
      color: 'rgb(255, 0, 0)',
      opacity: values.opacity,
      weight: values.weight
    }
  },
  stylePveRoads (feature) {
    let count = feature.properties.count
    let values = [
      {count: 20, weight: 2, opacity: 0.5},
      {count: 50, weight: 3, opacity: 0.7},
      {count: 100, weight: 4, opacity: 0.8},
      {count: 200, weight: 6, opacity: 0.9},
      {count: Number.MAX_VALUE, weight: 8, opacity: 1}
    ].find(x => x.count > count)

    return {
      color: 'rgb(0, 0, 255)',
      opacity: values.opacity,
      weight: values.weight
    }
  },
  accidentIconCreateFunction (cluster) {
    let n = cluster.getAllChildMarkers().length
    let index = [0, 3, 5, 10, 20, 30, 50].findIndex(x => x > n)
    if (index === -1) {
      index = 7
    }

    return new L.DivIcon({
      html: '<div><span>' + n + '</span></div>',
      className: `cluster-acc marker-cluster marker-cluster-size${index}`,
      iconSize: new L.Point(30, 30)
    })
  },
  radar_popup (feature, layer) {
    layer.bindPopup()
    layer.on({
      click: function () {
        let content = ''
        for (let p in feature.properties) {
          if (feature.properties[p]) {
            content += p + '&nbsp;: ' + feature.properties[p] + '</br>'
          }
        }
        content += '<a target="_blank" href=http://beta.datalab.mi/av/streetview2.html?posLat=' + feature.geometry.coordinates[1] + '+&posLng=' + feature.geometry.coordinates[0] + '>Voir dans streetview</a></br>'
        layer.bindPopup(content)
      }
    })
  },
  radar_marker (feature, latlng) {
    let content = '<i class="fa fa-camera aria-hidden="true"></i>'
    let myIcon = L.divIcon({className: 'radar-div-icon', html: content, iconSize: null})
    return L.marker(latlng, {icon: myIcon})
  },
  accident_popup (feature, layer) {
    layer.bindPopup()
    layer.on({
      click () {
        let content = '<i class="fa fa-info-circle" aria-hidden="true"></i></br>'

        for (let p in feature.properties) {
          if (!p.startsWith('_catv_') && feature.properties[p]) {
            content += p + '&nbsp;: ' + feature.properties[p] + '</br>'
          }
        }
        content += '<a target="_blank" href=http://beta.datalab.mi/av/streetview2.html?posLat=' + feature.geometry.coordinates[1] + '+&posLng=' + feature.geometry.coordinates[0] + '>voir dans streetview</a></br>'
        es.searchSimpleFilter('acc_usagers', 'Num_Acc', feature.properties['numéro accident']).then(function (resp) {
          content += '</br><i class="fa fa-users" aria-hidden="true"></i></br>'
          for (let h of resp.hits.hits) {
            content += h._source['sexe'] + ', ' + h._source['catu'] + ', ' + h._source['grav'] + '</br>'
          }
          es.searchSimpleFilter('acc_vehicules', 'Num_Acc', feature.properties['numéro accident']).then(function (resp) {
            content += '</br><i class="fa fa-car" aria-hidden="true"></i></br>'
            for (let h of resp.hits.hits) {
              let catv = h._source['catv'] || ''
              let choc = h._source['choc'] || ''
              let manv = h._source['manv'] || ''
              if (catv && choc) {
                choc = ', choc ' + choc
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
  accident_marker (feature, latlng) {
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
  }
}