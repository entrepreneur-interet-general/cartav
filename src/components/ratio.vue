<template>
  <div id='ratio'>
  <div v-if='!localLevel'>
    <h4>Métrique utilisée pour colorer la carte :</h4>
    <div class="form-group">
      <label for="dividende">Nombre de</label>
      <select v-model="dividende" class="form-control" id="dividende">
        <option>accidents</option>
        <option>PV électroniques</option>
        <option>habitants</option>
        <option value="longueur_routes">km de voirie</option>
      </select>
    </div>
    <div class="form-group">
      <label for="divisor">par</label>
      <select v-model="divisor" class="form-control" id="divisor">
        <option>accidents</option>
        <option>PV électroniques</option>
        <option>habitants</option>
        <option value="longueur_routes">km de voirie</option>
      </select>
    </div>
    <br>
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
    <br>
    <br>
    <br>
  </div>
  <div v-if='localLevel'>
    <h4>Données représentées</h4>
    <input type="radio" id="accidentsOnly" value="accidentsOnly" v-model="localLevelData">
    <label for="accidentsOnly">Accidents</label>
    <br>
    <input type="radio" id="pveOnly" value="pveOnly" v-model="localLevelData">
    <label for="pveOnly">PV électroniques</label>
    <br>
    <input type="radio" id="accidentsNoPve" value="accidentsNoPve" v-model="localLevelData">
    <label for="accidentsNoPve">Axes avec accidents, sans PV électroniques</label>
    <br>
    <input type="radio" id="pveNoAccidents" value="pveNoAccidents" v-model="localLevelData">
    <label for="pveNoAccidents">Axes avec PV électroniques, sans accidents</label>
    <br>
    <br>

    <h4>Représentation</h4>
    <input type="radio" id="clusterType" value="cluster" v-model="localLevelDisplay" :disabled=aggregatedByRoadOnly>
    <label for="clusterType">Nuage de points (cluster)</label>
    <abbr v-if=aggregatedByRoadOnly class="description-info-circle" title="La géolocalisation précise n'est disponible que pour les accidents"><i class='fa fa-info-circle'></i></abbr>
    <br>
    <input type="radio" id="heatMapType" value="heatmap" v-model="localLevelDisplay" :disabled=aggregatedByRoadOnly>
    <label for="heatMapType">Carte de chaleur (heatmap)</label>
    <abbr v-if=aggregatedByRoadOnly class="description-info-circle" title="La géolocalisation précise n'est disponible que pour les accidents"><i class='fa fa-info-circle'></i></abbr>
    <br>
    <input type="radio" id="aggregatedByRoadType" value="aggregatedByRoad" v-model="localLevelDisplay">
    <label for="aggregatedByRoadType">Routes</label>
    <br>
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
import criteriaList from '../assets/json/config.json'

export default {
  data () {
    return {
      colorScale: this.$store.state.colorScale,
      colors: colors.colors,
      colorScaleInverted: this.$store.state.colorScaleInverted,
      basemaps: criteriaList.basemaps
    }
  },
  computed: {
    basemapUrl: {
      get () {
        return this.$store.state.basemapUrl
      },
      set (basemapUrl) {
        this.$store.commit('set_basemapUrl', basemapUrl)
      }
    },
    localLevelData: {
      get () {
        return this.$store.state.localLevelData
      },
      set (newValue) {
        this.$store.dispatch('set_localLevelData', {localLevelData: newValue, router: this.$router})
      }
    },
    localLevelDisplay: {
      get () {
        return this.$store.state.localLevelDisplay
      },
      set (newValue) {
        this.$store.dispatch('set_localLevelDisplay', {localLevelDisplay: newValue, router: this.$router})
      }
    },
    dividende: {
      get () {
        return this.$store.state.dividende
      },
      set (newValue) {
        this.$store.commit('set_dividende', newValue)
      }
    },
    divisor: {
      get () {
        return this.$store.state.divisor
      },
      set (newValue) {
        this.$store.commit('set_divisor', newValue)
      }
    },
    localLevel () {
      return this.$store.getters.view.content === 'detailedContent'
    },
    aggregatedByRoad () {
      return this.$store.getters.view.content === 'detailedContent'
    },
    aggregatedByRoadOnly () {
      return this.localLevelData !== 'accidentsOnly'
    }
  },
  watch: {
    colorScale () {
      this.$store.commit('set_colorScale', this.colorScale)
    },
    colorScaleInverted () {
      this.$store.commit('set_colorScaleInverted', this.colorScaleInverted)
    }
  }
}
</script>

<style>
h4 {
  color: #0074d9;
}
</style>
