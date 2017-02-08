<template>
  <div id="filters">

    <button data-toggle="collapse" data-target="#demo">Collapsible</button>
    <div id="demo" class="collapse">
      Lorem ipsum dolor text....
    </div>

    <form>
        <span v-for="category in criteria_list">
            <h2>{{ category.name }}</h2>
            <span v-for="cat_list in category.values">
                <h3>{{ cat_list.name }}</h3>
                    <span v-for="val in cat_list.values">
                        <input type="checkbox" value="val.label" v-model="val.checked" v-on:click="emit_queries()"> {{val.label }}<br>
                    </span>
                <hr>
            </span>
            <hr>
            <hr>
        </span>
    </form>
  </div>
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
    generate_filter (type) {
      // Lit les critères cochés et génère la requête ES correspondante
      let fieldName = type === 'pve' ? 'field_name_pve' : 'field_name_acc'
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

      return must
    },
    generate_aggs (type, fieldName, size) {
      // Génère le champ aggrégation de la requête ES
      let aggs = {
        group_by: {
          terms: {
            field: fieldName,
            size: size
          }
        }
      }

      return aggs
    },
    get_query_base () {
      return {
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
        aggs: {}
      }
    },
    generate_query (type) {
      // Génération de la query ES
      let query = this.get_query_base()
      let must = this.generate_filter(type)
      let fieldDepartement = type === 'pve' ? 'DEPARTEMENT_INFRACTION' : 'dep'
      let aggs = this.generate_aggs(type, fieldDepartement, 150)

      query.query.constant_score.filter.bool.must = must
      query.aggs = aggs

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
