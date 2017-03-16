<template>
  <div id='legende'>
    {{ level + ': '}} <strong>{{ data.areaMouseOver }}</strong> </br>
    {{ data.ratioLegend + ': '}} <strong> {{ ratio }}</strong> </br>
    {{ 'Nombre d\'accidents: ' }} <strong>{{ Math.round(data.accidentsN) }}</strong> </br>
    {{ 'Nombre de pve: '}} <strong>{{ Math.round(data.pveN) }}</strong> </br>
  </div>
</template>

<script>
export default {
  data () {
    return {
      msg: 'coucou !'
    }
  },
  computed: {
    level () {
      return this.$store.state.level
    },
    levelAggregated () {
      return this.$store.state.level !== 'local'
    },
    ratio () {
      if (this.data.ratio > 10) {
        return Math.round(this.data.ratio)
      } else {
        console.log(this.data.ratio)
        return this.data.ratio
      }
    }
  },
  props: ['data']
}
</script>

<style>
#legende {
  z-index: 1000;
  position: fixed;
  right: 10px;
  top: 10px;
  background-color: white;
  padding: 5px;
  border-radius: 3px;
  font-size: 14px;


}
</style>
