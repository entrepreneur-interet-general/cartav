<template>
  <div id='hoverInfo'>
    <button type="button" class="btn btn-default" v-on:click='restore'><i class="fa fa-level-up"></i> Niveau supérieur</button>
    <hr>
    {{ level + ': '}} <strong>{{ data.areaMouseOver }}</strong> </br>
    {{ ratioLabel + ': '}} <strong> {{ ratio }}</strong> </br>
    {{ 'Nombre d\'accidents: ' }} <strong>{{ Math.round(data.accidentsN) }}</strong> </br>
    {{ 'Nombre de pve: '}} <strong>{{ Math.round(data.pveN) }}</strong> </br>
  </div>
</template>

<script>
import nd from '../assets/js/niceDisplay'

export default {
  computed: {
    level () {
      return this.$store.state.level
    },
    levelAggregated () {
      return this.$store.state.level !== 'local'
    },
    ratio () {
      return nd.niceDisplay(this.data.ratio)
    },
    ratioLabel () {
      return this.$store.getters.ratioLabel
    }
  },
  methods: {
    restore () {
      this.$router.go(-1)
    }
  },
  props: ['data']
}
</script>
<style>
</style>
