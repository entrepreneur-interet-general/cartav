<template>
  <div id='hoverInfo'>
    {{ decoupage }}&nbsp;: <strong>{{ data.areaMouseOver }}</strong> </br>
    {{ ratioLabel }}&nbsp;: <strong> {{ ratio }}</strong> </br>
    Nombre d’accidents&nbsp;: <strong>{{ accidentsN }}</strong> </br>
    Nombre de PV électroniques&nbsp;: <strong>{{ pveN }}</strong> </br>
    Kilomètres de voirie&nbsp;: <strong>{{ km_voie }} km</strong> </br>
  </div>
</template>

<script>
import nd from '../assets/js/niceDisplay'

export default {
  computed: {
    decoupage () {
      return nd.capitalize(this.$store.getters.view.linksTo[0].view)
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
    km_voie () {
      return Math.round(this.data.km_voie).toLocaleString('fr-FR')
    },
    ratioLabel () {
      return this.$store.getters.ratioLabel
    }
  },
  props: ['data']
}
</script>
