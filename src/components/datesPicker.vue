<template>
  <div>
    <h5>Accidents</h5>
    <div class="accidentsPickers">
      du <flat-pickr v-model="accidentsStartDate" :config="configAcc"></flat-pickr>
      au <flat-pickr v-model="accidentsEndDate" :config="configAcc" @on-change="setDate(acc)"></flat-pickr>
    </div>
    <hr>
    <h5>PV électroniques</h5>    
    <div class="pvePickers">
      du <flat-pickr v-model="pveStartDate" :config="configPve" @on-change="setDate(pve)"></flat-pickr>
      au <flat-pickr v-model="pveEndDate" :config="configPve" @on-change="setDate(pve)"></flat-pickr>
    </div>
  </div>
</template>

<script>
import constants from '../store/modules/constants'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { French } from 'flatpickr/dist/l10n/fr.js'

export default {
  components: {
    flatPickr
  },
  data () {
    return {
      acc: constants.ACC,
      pve: constants.PVE,
      config: {
        altFormat: 'd-m-Y',
        altInput: true,
        allowInput: true,
        locale: French
      }
    }
  },
  computed: {
    configAcc () {
      return {...this.config, ...this.bounds(this.acc)}
    },
    configPve () {
      return {...this.config, ...this.bounds(this.pve)}
    },
    accidentsStartDate: {
      get () {
        return this.$store.state.acc_dates[0]
      },
      set (val) {
        let vm = this
        let date = vm.stringToDate(val)
        if (date.getTime() !== this.$store.state.acc_dates[0].getTime()) {
          vm.$store.dispatch('set_dates', {
            dates: [date, vm.accidentsEndDate],
            router: vm.$router,
            type: vm.acc
          })
        }
      }
    },
    accidentsEndDate: {
      get () {
        return this.$store.state.acc_dates[1]
      },
      set (val) {
        let vm = this
        let date = vm.stringToDate(val)
        if (date.getTime() !== this.$store.state.acc_dates[1].getTime()) {
          vm.$store.dispatch('set_dates', {
            dates: [vm.accidentsStartDate, date],
            router: vm.$router,
            type: vm.acc
          })
        }
      }
    },
    pveStartDate: {
      get () {
        return this.$store.state.pve_dates[0]
      },
      set (val) {
        let vm = this
        let date = vm.stringToDate(val)
        if (date.getTime() !== this.$store.state.pve_dates[0].getTime()) {
          vm.$store.dispatch('set_dates', {
            dates: [date, vm.pveEndDate],
            router: vm.$router,
            type: vm.pve
          })
        }
      }
    },
    pveEndDate: {
      get () {
        return this.$store.state.pve_dates[1]
      },
      set (val) {
        let vm = this
        let date = vm.stringToDate(val)
        if (date.getTime() !== this.$store.state.pve_dates[1].getTime()) {
          vm.$store.dispatch('set_dates', {
            dates: [vm.pveStartDate, date],
            router: vm.$router,
            type: vm.pve
          })
        }
      }
    }
  },
  methods: {
    stringToDate (s) {
      // s expected to be in YYYY-MM-DD format
      let da = s.split('-')
      return new Date(da[0], da[1] - 1, da[2])
    },
    bounds (type) {
      let bounds = this.$store.getters.years.bounds[type]
      let minDate = new Date(bounds[0][0], bounds[0][1] - 1, bounds[0][2])
      let maxDate = new Date(bounds[1][0], bounds[1][1] - 1, bounds[1][2])
      return { minDate, maxDate }
    },
    setDateAcc (selectedDates, dateStr, instance) {
      let vm = this
      vm.$store.dispatch('set_dates', {
        dates: [selectedDates[0], vm.accidentsEndDate],
        router: vm.$router,
        type: vm.acc
      })
    },
    setDate (selectedDates, type) {
      let vm = this
      setTimeout(function () {
        // the timeout allows the date picker to close before the dispatch and commits
        vm.$store.dispatch('set_dates', {
          dates: type === constants.ACC ? [vm.accidentsStartDate, vm.accidentsEndDate] : [vm.pveStartDate, vm.pveEndDate],
          router: vm.$router,
          type: type
        })
      }, 1)
    }
  },
  mounted () {
  }
}
</script>

<style>
.flatpickr-input {
  display: inline-block !important;
  width: 120px;
}

.accidentsPickers>.flatpickr-input {
  background-color: rgba(253, 32, 32, 0.02);
}

.pvePickers>.flatpickr-input {
  background-color: rgba(9, 9, 253, 0.02);
}

.pvePickers {
  padding-bottom: 20px;
}

</style>
