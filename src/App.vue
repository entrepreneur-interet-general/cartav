<template>
  <div id="app" class="container">
      <filters></filters>
      <carte></carte>
  </div>
</template>

<script>
import carte from './components/map'
import filters from './components/filter'
import jQuery from 'jquery'
global.jQuery = jQuery
require('bootstrap')

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
