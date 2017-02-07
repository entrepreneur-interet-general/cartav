<template>
  <div id="filters">

    <button data-toggle="collapse" data-target="#demo">Collapsible</button>
    <div id="demo" class="collapse">
      Lorem ipsum dolor text....
    </div>

    <form>
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
    emit_queries () {
      this.$store.dispatch('set_queries', {
        pve: this.generate_query('pve'),
        acc: this.generate_query('acc')
      })
    },
    generate_query (type) {
      // lit les critères cochés et génère la requête ES correspondante
      let fieldName = type === 'pve' ? 'field_name_pve' : 'field_name_acc'
      let fieldDepartement = type === 'pve' ? 'DEPARTEMENT_INFRACTION' : 'dep'
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

      for (let scope of this.criteria_list) {
        for (let criteria of scope.values) {
          if (fieldName in criteria) {
            let criteriaFilters = []
            for (let value of criteria.values) {
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
      return query
    }
  },
  mounted () {
    this.emit_queries()
  }
}
</script>

<style>
#filters {
    width: 250px;
    height: 100%;
    overflow: scroll;
    float: left;
}
</style>
