<template>
<div>
  <h4> Récapitulatif des filtres </h4>
  <h5> Donnée représentée </h5>
  {{ currentView }}
  <h5> Filtres sur les dates </h5>
  <ul>
    <li v-if="showAcc">
      Accidents du {{ dates[constants.ACC][0] }} au {{ dates[constants.ACC][1] }}
    </li>
    <li v-if="showPVE">
      PV électroniques du {{ dates[constants.PVE][0] }} au {{ dates[constants.PVE][1] }}
    </li>
    <li v-for="criteria in bothFilters">
      {{criteria.name}} : {{criteria.general_rule}} {{criteria.exceptions.join(', ')}}
    </li>
  </ul>
  <div v-if="showAcc && accFilters.length > 0">
    <h5> Filtres sur les Accidents </h5>
    <ul>
      <li v-for="criteria in accFilters">
        {{criteria.name}} : {{criteria.general_rule}} {{criteria.exceptions.join(', ')}}
      </li>
    </ul>
  </div>
  <div v-if="showPVE && pveFilters.length > 0">
    <h5> Filtres sur les PV électroniques </h5>
    <ul>
      <li v-for="criteria in pveFilters">
        {{criteria.name}} : {{criteria.general_rule}} {{criteria.exceptions.join(', ')}}
      </li>
    </ul>
  </div>
</div>
</template>

<script>
import constants, { strings } from '../store/modules/constants'
import { mapState } from 'vuex'
import _ from 'lodash'

function generalRule (values) {
  const trueCount = _.filter(values, v => v).length
  const valuesCount = _.size(values)
  if (trueCount === valuesCount) {
    return 'Tout'
  } else if (trueCount === 0) {
    return 'Aucun'
  } else if (trueCount >= valuesCount / 2) {
    return 'Tout, sauf'
  } else {
    return ''
  }
}

function exceptions (values, labels = {}) {
  const keep = generalRule(values) === ''
  if (generalRule(values) !== 'Aucun') {
    return _(values).pickBy(v => keep ? v : !v)
                    .map((v, k) => labels[k] || k)
                    .value()
  } else {
    return []
  }
}

function filters (criteriaList) {
  return _(criteriaList).pickBy(v => !v.type || v.type !== 'vehiculeFilter')
                        .map((v, k) => ({
                          name: v.display_name || k,
                          general_rule: generalRule(v.values),
                          exceptions: exceptions(v.values, v.labels)
                        }))
                        .filter(el => el.general_rule !== 'Tout')
                        .value()
}

export default {
  data () {
    return {
      constants
    }
  },
  computed: mapState({
    localLevelData: 'localLevelData',
    criteria_list: 'criteria_list',
    isMetric () {
      return this.$store.getters.view.content === 'metric'
    },
    showAcc () {
      return this.isMetric || constants.PVE !== this.localLevelData
    },
    showPVE () {
      return this.isMetric || constants.ACC !== this.localLevelData
    },
    dates () {
      return this.$store.getters.humanDates
    },
    currentView () {
      if (!this.isMetric) {
        return strings[this.localLevelData]
      } else {
        return `métriques aggrégées par ${this.$store.getters.view.linksTo[0].view}`
      }
    },
    bothFilters () {
      return filters(this.criteria_list[strings[constants.ACC_AND_PVE]])
    },
    pveFilters () {
      return this.services.concat(
                  filters(this.criteria_list[strings[constants.PVE]]))
    },
    accFilters () {
      return this.vehicle.concat(
                  filters(this.criteria_list[strings[constants.ACC]]))
    },
    services () {
      const selected = this.$store.state.services_selected.list
      if (selected.length === 0) {
        return []
      } else {
        return [{
          name: 'Services',
          general_rule: '',
          exceptions: selected
        }]
      }
    },
    involved_vehicle () {
      return {
        name: 'Véhicules impliqués',
        general_rule: '',
        exceptions: _(this.criteria_list[strings[constants.ACC]])
                     .pickBy(v => v.type === 'vehiculeFilter')
                     .pickBy(v => v.values.true && !v.values.false)
                     .map((v, k) => k)
                     .value()
      }
    },
    not_involved_vehicle () {
      return {
        name: 'Véhicules pas impliqués',
        general_rule: '',
        exceptions: _(this.criteria_list[strings[constants.ACC]])
                     .pickBy(v => v.type === 'vehiculeFilter')
                     .pickBy(v => !v.values.true && v.values.false)
                     .map((v, k) => k)
                     .value()
      }
    },
    vehicle () {
      return [this.involved_vehicle, this.not_involved_vehicle].filter(el => el.exceptions.length > 0)
    }
  })
}

</script>

<style>
</style>
