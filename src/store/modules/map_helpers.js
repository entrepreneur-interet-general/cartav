import L from 'leaflet'
import es from './elastic_search'

const vehiculesIcons = {
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
    const count = feature.properties.count
    const values = [
      {count: 2, weight: 2, opacity: 0.4, color: 'rgb(255, 0, 0)'},
      {count: 4, weight: 2.5, opacity: 0.5, color: 'rgb(255, 0, 0)'},
      {count: 8, weight: 3, opacity: 0.6, color: 'rgb(200, 0, 0)'},
      {count: 15, weight: 3.5, opacity: 0.7, color: 'rgb(150, 0, 0)'},
      {count: 30, weight: 4, opacity: 0.8, color: 'rgb(100, 0, 0)'},
      {count: 60, weight: 4.5, opacity: 0.85, color: 'rgb(50, 0, 0)'},
      {count: 100, weight: 5, opacity: 0.9, color: 'rgb(20, 0, 0)'},
      {count: Number.MAX_VALUE, weight: 6, opacity: 1, color: 'rgb(20, 0, 0)'}
    ].find(x => x.count > count)
    feature.weight = values.weight

    return {
      color: values.color,
      opacity: values.opacity,
      weight: values.weight
    }
  },
  stylePveRoads (feature) {
    const count = feature.properties.count
    const values = [
      {count: 20, weight: 2, opacity: 0.4, color: 'rgb(0, 97, 255)'},
      {count: 50, weight: 2.5, opacity: 0.5, color: 'rgb(0, 97, 255)'},
      {count: 100, weight: 2.5, opacity: 0.6, color: 'rgb(0, 97, 255)'},
      {count: 200, weight: 3, opacity: 0.7, color: 'rgb(0, 81, 214)'},
      {count: 400, weight: 3.5, opacity: 0.8, color: 'rgb(0, 66, 175)'},
      {count: 800, weight: 4, opacity: 0.85, color: 'rgb(0, 50, 120)'},
      {count: 1500, weight: 4.5, opacity: 0.85, color: 'rgb(0, 40, 110)'},
      {count: 3000, weight: 5, opacity: 0.9, color: 'rgb(0, 20, 80)'},
      {count: Number.MAX_VALUE, weight: 8, opacity: 1, color: 'rgb(0, 20, 80)'}
    ].find(x => x.count > count)

    return {
      color: values.color,
      opacity: values.opacity,
      weight: values.weight
    }
  },
  accidentIconCreateFunction (cluster) {
    const n = cluster.getAllChildMarkers().length
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
      click () {
        let content = ''
        for (const p in feature.properties) {
          if (feature.properties[p]) {
            content += p + '&nbsp;: ' + feature.properties[p] + '</br>'
          }
        }
        content += '<a target="_blank" href=static/streetview.html?posLat=' + feature.geometry.coordinates[1] + '+&posLng=' + feature.geometry.coordinates[0] + '>Voir dans streetview</a></br>'
        layer.bindPopup(content)
      }
    })
  },
  radar_marker (feature, latlng) {
    const content = '<i class="fa fa-camera aria-hidden="true"></i>'
    const myIcon = L.divIcon({className: 'radar-div-icon', html: content, iconSize: null})
    return L.marker(latlng, {icon: myIcon})
  },
  accident_popup (feature, layer) {
    layer.bindPopup()
    layer.on({
      click () {
        let content = '<i class="fa fa-info-circle" aria-hidden="true"></i></br>'

        for (const p in feature.properties) {
          if (!p.startsWith('_catv_') && feature.properties[p]) {
            content += p + '&nbsp;: ' + feature.properties[p] + '</br>'
          }
        }
        content += '<a target="_blank" href=static/streetview.html?posLat=' + feature.geometry.coordinates[1] + '+&posLng=' + feature.geometry.coordinates[0] + '>voir dans streetview</a></br>'
        es.searchSimpleFilter('acc_usagers', 'Num_Acc', feature.properties['numéro accident']).then(function (resp) {
          content += '</br><i class="fa fa-users" aria-hidden="true"></i></br>'
          for (const h of resp.hits.hits) {
            content += h._source['sexe'] + ', ' + h._source['catu'] + ', ' + h._source['grav'] + '</br>'
          }
          es.searchSimpleFilter('acc_vehicules', 'Num_Acc', feature.properties['numéro accident']).then(function (resp) {
            content += '</br><i class="fa fa-car" aria-hidden="true"></i></br>'
            for (const h of resp.hits.hits) {
              const choc = h._source['choc'] ? `choc ${h._source['choc']}` : ''
              content += [h._source['catv'], choc, h._source['manv']].filter(x => x).join(', ') + '</br>'
            }
            layer.bindPopup(content)
          })
        })
      }
    })
  },
  accident_marker (feature, latlng) {
    let content = ''
    for (const p in feature.properties) {
      if (p.startsWith('_catv_')) {
        for (let i = 0; i < feature.properties[p]; ++i) {
          content += '<i class="fa fa-' + vehiculesIcons[p] + ' aria-hidden="true"></i> '
        }
      }
    }
    const myIcon = L.divIcon({className: 'my-div-icon', html: content, iconSize: null})
    return L.marker(latlng, {icon: myIcon})
  }
}
