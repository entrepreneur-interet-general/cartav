<template>
  <div id="filters">

    <button data-toggle="collapse" data-target="#demo">Collapsible</button>
    <div id="demo" class="collapse">
      Lorem ipsum dolor text....
    </div>

    {{ get_level }}

    <form>
        <span v-for="(category, categoryName) in get_criteria_list">
            <h2>{{ categoryName }}</h2>
            <span v-for="(criteria, criteriaName) in category">
                <h3>{{ criteriaName }}</h3>
                    <span v-for="(val, valName) in criteria.values">
                      <input type="checkbox" value="criteriaName" v-on:click="set_criteria(categoryName+'.'+criteriaName+'.values.'+valName, !val)" :checked="val"> 
                      {{valName }} 
                      <span class="agg_acc" v-if="agg_acc_value(categoryName, criteriaName, valName)"> 
                        [ {{ agg_acc_value(categoryName, criteriaName, valName) }} ]
                        </span>
                      <span class="agg_pve" v-if="agg_pve_value(categoryName, criteriaName, valName)">
                        [ {{ agg_pve_value(categoryName, criteriaName, valName) }} ]
                      </span>
                      <br>
                    </span>
                <hr>
            </span>
    </form>
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
  } else if (n > 1000) {
    n = Math.round(n / 100) / 10 + 'k'
  }
  return n
}

export default {
  data () {
    return {
      agg_acc: {},
      agg_pve: {}
    }
  },
  computed: {
    get_criteria_list () {
      return this.$store.state.criteria_list
    },
    get_level () {
      return this.$store.getters.get_level
    }
  },
  methods: {
    set_criteria (criteriaPath, value) {
      this.$store.dispatch('set_criteria', {criteriaPath: criteriaPath, value: value})
      this.get_aggregated(this)
    },
    get_aggregated (vm) {
      this.$store.getters.aggregated_acc.then(function (res) {
        vm.agg_acc = res
      })
      this.$store.getters.aggregated_pve.then(function (res) {
        vm.agg_pve = res
      })
    },
    agg_pve_value (categoryName, criteriaName, valName) {
      return niceDisplay(this.agg_pve[categoryName + '.' + criteriaName + '.' + valName])
    },
    agg_acc_value (categoryName, criteriaName, valName) {
      return niceDisplay(this.agg_acc[categoryName + '.' + criteriaName + '.' + valName])
    }
  },
  mounted () {
    this.$store.dispatch('queryES')
    this.get_aggregated(this)
  }
}
</script>

<style>
#filters {
    width: 250px;
    height: 100%;
    overflow: scroll;
    float: left;
    resize: horizontal;
}
.agg_acc {
  color: red;
}
.agg_pve {
  color: blue;
}
h2 {
  background-color: #BEBEBE;
}
</style>
