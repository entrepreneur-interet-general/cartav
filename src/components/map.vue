<template>
    <div id="map2">
    </div>
</template>

<script>
import L from 'leaflet'
import '../../node_modules/leaflet/dist/leaflet.css'

export default {
  mounted () {
    var map = L.map('map2', {
      zoomControl: false
    }).setView([45.853459, 2.349312], 6)

    L.tileLayer(' http://osm.psi.minint.fr/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 18
    }).addTo(map)
  }
}
</script>

<style>
#map2 {
    height: 100%;
    width: 80%;
    float: right;
}
</style>