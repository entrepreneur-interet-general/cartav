<template>
  <div id='legende'>
    <hr>
    <span v-if='hasScale && !localLevel'>
      <h4>{{ ratioLabel }}</h4>
      <div> valeur moyenne: {{ ratioAverage }}</div>
      <div v-for='(color, i) in colors'>
        <span class='oneColor' v-bind:style="'background-color:'+color+';'"></span>
        <span class='legendNumber'>{{ getRange(i) }}</span>
      </div>
    </span>
  </div>
</template>

<script>
import nd from '../assets/js/niceDisplay'

export default {
  computed: {
    legendScale () {
      return this.$store.getters.legendScale
    },
    ratioAverage () {
      return nd.niceDisplay(this.$store.getters.ratioAverage)
    },
    colors () {
      return this.$store.getters.colors
    },
    hasScale () {
      return this.legendScale.length !== 0
    },
    localLevel () {
      return this.$store.getters.parent.subLevel === 'local'
    },
    ratioLabel () {
      return this.$store.getters.ratioLabel
    }
  },
  methods: {
    getRange (i) {
      if (i === 0) {
        return '< ' + nd.niceDisplay(this.legendScale[0])
      } else if (i === nd.niceDisplay(this.legendScale.length)) {
        return '> ' + nd.niceDisplay(this.legendScale[this.legendScale.length - 1])
      } else {
        return nd.niceDisplay(this.legendScale[i - 1]) + ' - ' + nd.niceDisplay(this.legendScale[i])
      }
    }
  },
  props: ['data']
}
</script>

<style>
#legende div {
  padding-bottom: 10px;
}
#legende h4 {
  font-size: 16px;
}
.oneColor {
  padding: 10px 30px 0px 0px;
  border: 1px solid grey;
}
.legendNumber {
  padding-left: 10px;
}
#legende {
  position: absolute;
  bottom: 0px;
  width: 100%;
}
</style>
