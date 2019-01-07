<template>
  <div id='legende' v-if='hasScale && !localLevel'>
    <h4>{{ ratioLabel }}</h4>
    <div> Valeur moyenne: {{ ratioAverage }}</div>
    <div v-for='(color, i) in colors' class='colorScale'>
      <span class='oneColor' v-bind:style="style(i)"></span>
      <span class='legendNumber'>{{ getRange(i) }}</span>
    </div>
  </div>
</template>

<script>
import nd from '../assets/js/niceDisplay'
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters([
      'legendScale',
      'colors',
      'localLevel',
      'ratioLabel'
    ]),
    ratioAverage () {
      return nd.niceDisplay(this.$store.getters.ratioAverage)
    },
    hasScale () {
      return this.legendScale.length !== 0
    }
  },
  methods: {
    getRange (i) {
      if (i === 0) {
        return '> ' + nd.niceDisplay(this.legendScale[0])
      } else if (i === this.legendScale.length) {
        return '< ' + nd.niceDisplay(this.legendScale[this.legendScale.length - 1])
      } else {
        return nd.niceDisplay(this.legendScale[i - 1]) + ' – ' + nd.niceDisplay(this.legendScale[i])
      }
    },
    style (i) {
      const stripes = this.$store.getters.stripes[i]
      const angle = stripes.angle
      const weight = stripes.weight
      const color = this.colors[i]
      return `background: repeating-linear-gradient(${angle}deg, ${color}, ${color} ${weight}px, rgba(0, 0, 0, 0.8) ${8 - weight}px, rgba(0, 0, 0, 0.8) 8px);`
    }
  }
}
</script>

<style>
.colorScale {
  padding-top: 10px;
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
  bottom: 0;
  right: 0;
  max-height: 25%;
  overflow: hidden;
  z-index: 1500;
  background-color: rgba(255, 255, 255, 0.90);
  cursor: auto;
}
@media (min-width: 768px) {
  #legende {
    padding: 10px;
    border-radius: 4px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    bottom: 20px;
    right: 10px;
    width: 300px;
  }
}
</style>
