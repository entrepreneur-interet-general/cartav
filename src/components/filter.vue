<template>
  <div id="filters">
    <h4>Niveau : {{ level }}</h4>

    <div>
        <span v-for="(category, categoryName) in criteria_list">
          <div class="categoryTitle">
            <h2>{{ categoryName }}</h2>
            <button type="button" class="btn btn-xs btn-default" data-toggle="collapse" v-bind:data-target="'#id'+categoryName.replace(/ /g,'_')"><i class="glyphicon glyphicon-chevron-down"></i></button>
          </div>
          
          <span v-bind:id="'id'+categoryName.replace(/ /g,'_')" class="collapse">
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
            </span>
        </span>
        <hr>
      </span>
    </div>
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
      // agg_acc: {},
      // agg_pve: {},
      show: true
    }
  },
  computed: {
    criteria_list () {
      return this.$store.state.criteria_list
    },
    level () {
      return this.$store.state.level
    },
    agg_acc () {
      console.log('BLIII')
      return this.$store.state.accidents_values_by_filter
    },
    agg_pve () {
      return this.$store.state.pve_values_by_filter
    }
  },
  watch: {
    level () {
      // this.get_aggregated()
    }
  },
  methods: {
    set_criteria (criteriaPath, value) {
      this.$store.dispatch('set_criteria', {criteriaPath: criteriaPath, value: value})
      this.get_aggregated()
    },
    get_aggregated () {
      let vm = this
      this.$store.getters.aggregated_acc.then(function (res) {
        // vm.agg_acc = res
      })
      this.$store.getters.aggregated_pve.then(function (res) {
        vm.agg_pve = res
      })
    },
    agg_pve_value (categoryName, criteriaName, valName) {
      if (this.agg_pve) {
        return niceDisplay(this.agg_pve[categoryName + '.' + criteriaName + '.' + valName])
      }
    },
    agg_acc_value (categoryName, criteriaName, valName) {
      if (this.agg_acc) {
        return niceDisplay(this.agg_acc[categoryName + '.' + criteriaName + '.' + valName])
      }
    }
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
.categoryTitle {
  background-color: white;
  padding: 1px;
  text-align: center;
}
h2 {
  font-size : 18px;
  font-weight: bold;
  padding: 0px;
}
h3 {
  font-size: 16px;
  font-weight: bold;
}
h4 {
  font-size: 14px;
}
</style>
