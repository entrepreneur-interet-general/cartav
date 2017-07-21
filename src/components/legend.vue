<template>
  <div id='legende' v-if='hasScale && !localLevel'>
    <h4>{{ ratioLabel }}</h4>
    <div> valeur moyenne: {{ ratioAverage }}</div>
    <div v-for='(color, i) in colors' class='colorScale'>
      <span class='oneColor' v-bind:style="'background-color:'+color+';'"></span>
      <span class='legendNumber'>{{ getRange(i) }}</span>
    </div>
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
      return this.$store.getters.view.content === 'detailedContent'
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
  width: 100%;
  overflow: hidden;
  z-index: 2000;
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
