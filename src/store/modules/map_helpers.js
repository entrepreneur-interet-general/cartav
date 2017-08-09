import L from 'leaflet'

export default {
  vehiculesIcons: {
    _catv_voiture_nb: 'car',
    _catv_utilitaire_nb: 'car',
    _catv_deuxrouesmotorises_nb: 'motorcycle',
    _catv_velo_nb: 'bicycle',
    _catv_poidslourd_nb: 'truck',
    _catv_vehiculeautre_nb: 'car',
    _catv_pietons_nb: 'male'
  },
  styleAccidents (feature) {
    return {
      opacity: 0,
      fillOpacity: 0
    }
  },
  styleAccidentsRoads (count) {
    return function (feature) {
      let values = [
        {count: 2, weight: 2, opacity: 0.5},
        {count: 4, weight: 3, opacity: 0.7},
        {count: 5, weight: 4, opacity: 0.8},
        {count: Number.MAX_VALUE, weight: 6, opacity: 1}
      ].find(x => x.count > count)

      // store opacity, weight here to be able to reset it
      feature.opacity = values.opacity
      feature.weight = values.weight
      return {
        color: 'rgb(255, 0, 0)',
        opacity: values.opacity,
        weight: values.weight
      }
    }
  },
  stylePveRoads (count) {
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
  }
}
