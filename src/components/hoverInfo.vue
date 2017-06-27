<template>
  <div id='hoverInfo'>
    {{ decoupage }}: <strong>{{ data.areaMouseOver }}</strong> </br>
    {{ ratioLabel }}: <strong> {{ ratio }}</strong> </br>
    Nombre d’accidents: <strong>{{ accidentsN }}</strong> </br>
    Nombre de pve: <strong>{{ pveN }}</strong> </br>
  </div>
</template>

<script>
import nd from '../assets/js/niceDisplay'

export default {
  computed: {
    decoupage () {
      return this.$store.getters.view.linksTo
    },
    ratio () {
      return nd.niceDisplay(this.data.ratio)
    },
    accidentsN () {
      return nd.niceDisplay(this.data.accidentsN)
    },
    pveN () {
      return nd.niceDisplay(this.data.pveN)
    },
    ratioLabel () {
      return this.$store.getters.ratioLabel
    }
  },
  props: ['data']
}
</script>
