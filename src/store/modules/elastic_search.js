import elasticsearch from 'elasticsearch'

export default { search, generateQuery, generateQueryAggByFilter, getFieldsMap }

function getFieldsMap () {
  return {
    'acc': {
      'region': 'NOM_REG.NOM_REG_facet',
      'departement': 'dep'
    },
    'pve': {
      'region': 'NOM_REG.NOM_REG_facet',
      'departement': 'DEPARTEMENT_INFRACTION'
    }
  }
}

let client = new elasticsearch.Client({
  host: 'http://10.237.27.129:80',
  apiVersion: '2.2'
})

function search (type, query) {
  let index = type === 'pve' ? 'es2_2010_2015_pve_sr' : 'es2_2005_2015_accidents_caracteristiques_lieux'
  // console.log(type)
  // console.log(query)
  return client.search({
    index: index,
    body: query
  })
}

function generateFilter (criteriaList, type, ExceptThisfield = undefined) {
  // Lit les critères cochés et génère la requête ES correspondante
  let fieldName = type === 'pve' ? 'field_name_pve' : 'field_name_acc'
  var must = []

  for (let scopeName in criteriaList) {
    let scope = criteriaList[scopeName]
    for (let criteriaName in scope) {
      let criteria = scope[criteriaName]
      if (fieldName in criteria) {
        let criteriaPath = scopeName + '.' + criteriaName
        if (criteriaPath !== ExceptThisfield) {
          let criteriaFilters = []
          for (let valueName in criteria.values) {
            if (criteria.values[valueName]) {
              let f = {}
              f[criteria[fieldName]] = valueName
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
  }

  return must
}

function generateAggs (type, fieldName, size) {
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
}

function getQueryBase () {
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
}

function addAdditionalFilters (must, type, additionalCriterias) {
  for (let crit of additionalCriterias) {
    let filterName = getFieldsMap()[type][crit.level]
    let f = {}
    f[filterName] = crit.name
    must.push({
      bool: {
        should: [{term: f}]
      }
    })
  }
}

function generateQuery (criteriaList, type, level, additionalCriterias) {
  // Génération de la query ES
  let query = getQueryBase()
  let must = generateFilter(criteriaList, type)
  addAdditionalFilters(must, type, additionalCriterias)
  let aggKey = getFieldsMap()[type][level]
  let aggs = generateAggs(type, aggKey, 150)

  query.query.constant_score.filter.bool.must = must
  query.aggs = aggs

  return query
}

function generateQueryAggByFilter (criteriaList, type) {
  let promises = []
  let criteriaPaths = []
  let fieldNameType = type === 'pve' ? 'field_name_pve' : 'field_name_acc'
  for (let scopeName in criteriaList) {
    let scope = criteriaList[scopeName]
    for (let criteriaName in scope) {
      let criteria = scope[criteriaName]
      if (fieldNameType in criteria) {
        let criteriaPath = scopeName + '.' + criteriaName
        let query = getQueryBase()
        let must = generateFilter(criteriaList, type, criteriaPath)
        let fieldName = criteria[fieldNameType]
        let aggs = generateAggs(type, fieldName, 150)

        query.query.constant_score.filter.bool.must = must
        query.aggs = aggs
        promises.push(search(type, query))
        criteriaPaths.push(criteriaPath)
      }
    }
  }
  return Promise.all(promises).then(function (values) {
    let res = {}
    values.forEach(function (value, i) {
      value.aggregations.group_by.buckets.forEach(function (b) {
        res[criteriaPaths[i] + '.' + b['key']] = b['doc_count']
      })
    })
    return res
  })
}
