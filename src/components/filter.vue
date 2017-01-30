<template>
    <form id="filters">
        <span v-for="category in criteria_list">
            <h2>{{ category.name }}</h2>
            <span v-for="cat_list in category.values">
                <h3>{{ cat_list.name }}</h3>
                    <span v-for="val in cat_list.values">
                        <input type="checkbox" name="crit.name" value="val.label" v-model="val.checked" v-on:click="update_clusters()"> {{val.label }}<br>
                    </span>
                <hr>
            </span>
            <hr>
            <hr>
        </span>
    </form>
</template>

<script>
import criteriaList from '../assets/json/criteria_list.json'

export default {
  data () {
    return {
      criteria_list: criteriaList.criteria_list
    }
  },
  methods: {
    update_clusters () {
      let queryPve = this.generate_query('pve')
      // searchAndDisplay('es2_2010_2015_pve_sr', query_pve, markers_pve)
      let queryAcc = this.generate_query('acc')
      // searchAndDisplay('es2_2005_2015_accidents_caracteristiques_lieux', query_acc, markers_acc)
      console.log(queryPve, queryAcc)
    },
    generate_query (dataset) {
      // lit les critères cochés et génère la requête ES correspondante
      let fieldName = dataset === 'pve' ? 'field_name_pve' : 'field_name_acc'
      let fieldDepartement = dataset === 'pve' ? 'DEPARTEMENT_INFRACTION' : 'dep'
      let query = {
        size: 0,
        query: {
          constant_score: {
            filter: {
              bool: {
                must: []
              }
            }
          }
        },
        aggs: {
          group_by_dep: {
            terms: {
              field: fieldDepartement,
              size: 150
            }
          }
        }
      }

      var must = []

      for (let scope in this.criteria_list) {
        for (let criteria in scope.values) {
          if (fieldName in criteria) {
            let criteriaFilters = []
            for (let value in criteria.values) {
              if (value.checked) {
                let f = {}
                f[criteria[fieldName]] = value.label
                let filter = {
                  term: f
                }
                criteriaFilters.push(filter)
              }
            }
            if (criteriaFilters.length === 0) {
              // ~hack~ rien n'est coché : pas de résultats attendus
              let f = {}
              f[criteria[fieldName]] = -1
              criteriaFilters.push({
                term: f
              })
            }
            must.push({
              bool: {
                should: criteriaFilters
              }
            })
          }
        }
      }
      query.query.constant_score.filter.bool.must = must
      return JSON.stringify(query)
    }
  }
}
</script>

<style>
#filters {
    width: 20%;
    float: left;
}
</style>
