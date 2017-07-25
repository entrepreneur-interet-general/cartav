<template>
  <div id="app">
    <filters id="sidebar" class="sidebar collapsed"></filters>
    <carte class="sidebar-map"></carte>
  </div>
</div>
</template>

<script>
import carte from './map'
import filters from './filter'

export default {
  name: 'app',
  components: {
    carte,
    filters
  }
}
</script>

<style>
html, body, #app {
  height: 100%;
  width: 100%;
  margin: 0px;
}
</style>
