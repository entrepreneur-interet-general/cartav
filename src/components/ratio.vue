<template>
  <div id='ratio'>
  <div v-if='!localLevel'>
    <h4>Métrique utilisée pour colorer la carte :</h4>
    <div class="form-group">
      <label for="dividende">Nombre de</label>
      <select v-model="dividende" class="form-control" id="dividende">
        <option>accidents</option>
        <option>PVE</option>
        <option>habitants</option>
      </select>
    </div>
    <div class="form-group">
      <label for="divisor">par</label>
      <select v-model="divisor" class="form-control" id="divisor">
        <option>accidents</option>
        <option>PVE</option>
        <option>habitants</option>
      </select>
    </div>
    <hr>
    <h4>Palette</h4>
    <span v-for="(colorsList, scaleName) in colors">
    <input type="radio" v-bind:value=scaleName v-model="colorScale">
    <label v-bind:for="scaleName">
      <span v-for="colorCode in colorsList">
        <span v-bind:style="'background-color:' + colorCode + '; padding-left: 25px;'"></span>
      </span>
    </label>
    <br>
    </span>
    <input type="checkbox" id="colorsScaleInvert" v-model="colorScaleInverted">
    <label for="colorsScaleInvert"> ordre des couleurs inversé </label>
    <hr>
  </div>
  <div v-if='localLevel'>
    <h4>Carte locale</h4>

    <input type="radio" id="clusterType" value="cluster" v-model="localLevelDisplay">
    <label for="clusterType">Nuage de points (cluster)</label>
    <br>
    <input type="radio" id="heatMapType" value="heatmap" v-model="localLevelDisplay">
    <label for="heatMapType">Carte de chaleur (heatmap)</label>
    <br>
    <input type="radio" id="aggregatedByRoadType" value="aggregatedByRoad" v-model="localLevelDisplay">
    <label for="aggregatedByRoadType">Routes</label>
    <br>
  </div>
  <h4>Fonds de carte</h4>
  <span v-for="(url, name) in basemaps">
    <input type="radio" :id=url :value=url v-model="basemapUrl">
    <label v-bind:for="url">
      {{ name }}
    </label>
    <br>
  </span>
  </div>
</template>

<script>
import colors from '../assets/json/colors.json'
import criteriaList from '../assets/json/criteria_list_new.json'

export default {
  data () {
    return {
      dividende: this.$store.state.dividende,
      divisor: this.$store.state.divisor,
      localLevelDisplay: this.$store.state.localLevelDisplay,
      colorScale: this.$store.state.colorScale,
      colors: colors,
      colorScaleInverted: this.$store.state.colorScaleInverted,
      basemaps: criteriaList.basemaps,
      basemapUrl: this.$store.state.basemapUrl
    }
  },
  computed: {
    localLevel () {
      return this.$store.getters.parent.subLevel === 'local'
    }
  },
  watch: {
    dividende () {
      this.$store.commit('set_dividende', this.dividende)
    },
    divisor () {
      this.$store.commit('set_divisor', this.divisor)
    },
    localLevelDisplay () {
      this.$store.dispatch('set_localLevelDisplay', this.localLevelDisplay)
    },
    colorScale () {
      this.$store.commit('set_colorScale', this.colorScale)
    },
    colorScaleInverted () {
      this.$store.commit('set_colorScaleInverted', this.colorScaleInverted)
    },
    basemapUrl () {
      this.$store.commit('set_basemapUrl', this.basemapUrl)
    }
  }
}
</script>

<style>
</style>
