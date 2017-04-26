<template>
  <div id='hoverInfo'>
    <button type="button" class="btn btn-default" v-on:click='restore'><i class="fa fa-level-up"></i> Niveau supérieur</button>
    <hr>
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
      return this.$store.getters.view.contour.decoupage
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
  methods: {
    restore () {
      this.$router.go(-1)
    }
  },
  props: ['data']
}
</script>
