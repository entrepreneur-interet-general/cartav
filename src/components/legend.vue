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
function niceDisplay (n) {
  // Gère l'affichage des nombres dans les clusters
  if (n > 1000000) {
    n = Math.round(n / 10000) / 100 + 'm'
  }
  if (n > 10000) {
    n = Math.round(n / 1000) + 'k'
  }
  if (n > 1000) {
    n = Math.round(n / 100) / 10 + 'k'
  }
  if (n > 10) {
    n = Math.round(n * 10) / 10
  }
  if (n > 1) {
    n = Math.round(n * 100) / 100
  }
  if (n < 1) {
    let k = Math.round(-Math.log(n))
    n = Math.round(n * Math.pow(10, k)) / Math.pow(10, k)
  }
  return n
}

export default {
  computed: {
    legendScale () {
      return this.$store.getters.legendScale
    },
    ratioAverage () {
      return niceDisplay(this.$store.getters.ratioAverage)
    },
    colors () {
      return this.$store.getters.colors
    },
    hasScale () {
      return this.legendScale.length !== 0
    },
    localLevel () {
      return this.$store.state.level === 'local'
    },
    ratioLabel () {
      return this.$store.getters.ratioLabel
    }
  },
  methods: {
    getRange (i) {
      if (i === 0) {
        return '< ' + niceDisplay(this.legendScale[0])
      } else if (i === niceDisplay(this.legendScale.length)) {
        return '> ' + niceDisplay(this.legendScale[this.legendScale.length - 1])
      } else {
        return niceDisplay(this.legendScale[i - 1]) + ' - ' + niceDisplay(this.legendScale[i])
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
