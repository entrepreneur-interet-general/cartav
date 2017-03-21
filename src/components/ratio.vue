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
    <label for="one">Nuage de points (cluster)</label>
    <br>
    <input type="radio" id="heatMapType" value="heatmap" v-model="localLevelDisplay">
    <label for="two">Carte de chaleur (heatmap)</label>
    <br>
  </div>
  <button v-on:click="the24hShow()">24h show !</button>
</template>

<script>
import colors from '../assets/json/colors.json'

export default {
  data () {
    return {
      dividende: this.$store.state.dividende,
      divisor: this.$store.state.divisor,
      localLevelDisplay: this.$store.state.localLevelDisplay,
      colorScale: this.$store.state.colorScale,
      colors: colors,
      colorScaleInverted: this.$store.state.colorScaleInverted
    }
  },
  computed: {
    localLevel () {
      return this.$store.state.level === 'local'
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
      this.$store.commit('set_localLevelDisplay', this.localLevelDisplay)
    },
    colorScale () {
      this.$store.commit('set_colorScale', this.colorScale)
    },
    colorScaleInverted () {
      this.$store.commit('set_colorScaleInverted', this.colorScaleInverted)
    }
  },
  methods: {
    the24hShow () {
      let vm = this
      for (let i = 0; i < 24; ++i) {
        this.$store.commit('set_criteria', {criteriaPath: 'Accidents.Heure.values.' + i, value: false})
      }

      for (let i = 0; i < 24; ++i) {
        setTimeout(function () {
          vm.$store.dispatch('set_criteria', {criteriaPath: 'Accidents.Heure.values.' + i, value: true})
          setTimeout(function () {
            vm.$store.dispatch('set_criteria', {criteriaPath: 'Accidents.Heure.values.' + i, value: false})
          }, 2000)
        }, 2400 * (i + 1))
      }
    }
  },
  mounted () {
    // this.$store.commit('set_dividende', 'accidents')
    // this.$store.commit('set_divisor', 'habitants')
  },
  props: []
}
</script>

<style>
</style>
