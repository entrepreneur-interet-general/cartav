<template>
  <div class='sliders'>
    <div ref='sliderAcc' class='slider acc'></div>
    <div ref='sliderPVE' class='slider pve'></div>
  </div>
</template>

<script>
import slider from 'nouislider'
import 'nouislider/distribute/nouislider.css'
import {PVE, ACC} from '../store/modules/constants'

export default {
  data () {
    return {
      begin: {acc: this.$store.state.acc_dates[0], pve: this.$store.state.pve_dates[0]},
      end: {acc: this.$store.state.acc_dates[1], pve: this.$store.state.pve_dates[1]},
      sliders: {}
    }
  },
  methods: {
    format: val => `${val % 12 + 1}/${Math.floor(val / 12)}`,
    bounds (type) {
      return this.$store.getters.years.bounds[type]
             .map(([year, month]) => year * 12 + month - 1)
    },
    update (values, handle, type) {
      if (handle === 0) {
        this.begin[type] = values[0]
      } else {
        this.end[type] = values[1]
      }
    },
    setYear (type) {
      this.$store.dispatch('set_dates', {
        dates: [Math.floor(this.begin[type]), Math.floor(this.end[type])],
        router: this.$router,
        type: type
      })
    }
  },
  mounted () {
    const format = { to: this.format }

    this.sliders = {
      acc: this.$refs.sliderAcc,
      pve: this.$refs.sliderPVE
    }

    slider.create(this.sliders.acc, {
      start: [this.begin.acc, this.end.acc],
      connect: true,
      range: {
        min: this.bounds(ACC)[0],
        max: this.bounds(ACC)[1]
      },
      step: 3,
      pips: {
        mode: 'steps',
        density: 2,
        format: { to: val => Math.floor(val / 12) },
        filter: val => val % 24 === 0 ? 1 : 0
      },
      tooltips: [format, format]
    })

    slider.create(this.sliders.pve, {
      start: [this.begin.pve, this.end.pve],
      connect: true,
      range: {
        min: this.bounds(PVE)[0],
        max: this.bounds(PVE)[1]
      },
      step: 1,
      pips: {
        mode: 'steps',
        density: 12,
        format: { to: val => Math.floor(val / 12) },
        filter: val => val % 12 === 0 ? 1 : 0
      },
      tooltips: [format, format]
    })

    for (const type of [ACC, PVE]) {
      this.sliders[type].noUiSlider.on('update', (v, h) => this.update(v, h, type))
      this.sliders[type].noUiSlider.on('set', () => this.setYear(type))
    }
  }
}
</script>

<style>
.sliders {
  margin-bottom: 4em;
}

.slider {
  margin-top: 3.5em;
  margin-bottom: 5em;
}

.noUi-tooltip {
  padding: 2px !important;
  font-size: 12px;
}
.acc .noUi-connect {
  background: rgb(253, 32, 32);
  border-radius: 0px;
}

.pve .noUi-connect {
  background: rgb(9, 9, 253);
  border-radius: 0px;
}

.noUi-handle::after {
    left: 4px !important;
}

.noUi-handle::before {
  left: 8px !important;
}

.noUi-handle {
  outline:none;
}

.noUi-handle-lower {
  border-radius: 10px 0px 0px 10px !important;
  width: 16px !important;
  left: -15px !important;
}

.noUi-handle-upper {
  border-radius: 0px 10px 10px 0px !important;
  width: 16px !important;
  left: -1px !important;
}
</style>
