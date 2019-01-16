<template>
<div>
  <h3 id="ghgh">
    Cette carte représente...
  </h3>
  <h4>
    {{ currentView }}
  </h4>
  <ul>
    <li v-if="showAcc">
      du <strong>{{ dates[constants.ACC][0] }}</strong> au <strong>{{ dates[constants.ACC][1] }}</strong> <span v-if="isMetric || constants.ACC !== localLevelData">pour les accidents</span>
    </li>
    <li v-if="showPVE">
      du <strong>{{ dates[constants.PVE][0] }}</strong> au <strong>{{ dates[constants.PVE][1] }}</strong> <span v-if="isMetric || constants.PVE !== localLevelData">pour les PVE</span>
    </li>
    <li v-for="criteria in bothFilters">
      {{criteria.name}} : <strong>{{criteria.general_rule}} {{criteria.exceptions.join(', ')}}</strong>
    </li>
  </ul>
  <div v-if="showAcc && accFilters.length > 0">
    <h3 v-if="constants.ACC !== localLevelData"> Filtres sur les Accidents </h3>
    <ul>
      <li v-for="criteria in accFilters">
        {{criteria.name}} : <strong>{{criteria.general_rule}} {{criteria.exceptions.join(', ')}}</strong>
      </li>
    </ul>
  </div>
  <div v-if="showPVE && pveFilters.length > 0">
    <h3 v-if="constants.PVE !== localLevelData"> Filtres sur les PV électroniques </h3>
    <ul>
      <li v-for="criteria in pveFilters">
        {{criteria.name}} : <strong>{{criteria.general_rule}} {{criteria.exceptions.join(', ')}}</strong>
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
        return 'Les ' + strings[this.localLevelData]
      } else {
        return `Une métrique aggrégée par ${this.$store.getters.view.linksTo[0].view}`
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
        name: 'Véhicules non impliqués',
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

<style scoped>
h3 {
  font-size: 12px;
  color: rgb(105, 105, 105);
}

ul {
  padding-left: 15px;
}

li {
  list-style-type: circle;
}
</style>
