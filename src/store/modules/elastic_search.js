import elasticsearch from 'elasticsearch'
import _ from 'lodash'
import aggregationLevelsInfos from '../../assets/json/aggregationLevelsInfos'

export default { search, searchAsGeoJson, generateQuery, generateAggregatedQuery, generateAggregatedQueryByFilter, getCommunesGeoJson, searchSimpleFilter, toRoadsDict, generateGraphAgg }

let communesGeoJsonFields = {
  Population: 'Population',
  nom: 'Commune',
  code: 'Code INSEE',
  CODE_DEPT: 'Code Département'
}

let index = {
  acc: 'es5_2005_2015_accidents_custom_mapping',
  pve: 'es5_2015_pve_sr_regions_custom_mapping',
  commune: 'es5_2016_geohisto_communes_complete2',
  acc_usagers: 'es2_accidents_usagers',
  acc_vehicules: 'es2_accidents_vehicules',
  radars: 'es5dev_radars'
}

let client = new elasticsearch.Client({
  host: process.env.ES_HOST,
  apiVersion: '5.x'
})

function search (type, query) {
  return client.search({
    index: index[type],
    body: query
  })
}

function searchAsGeoJson (type, query, latField, longField, propertyFields) {
  return search(type, query).then(function (resp) {
    return generateGeoJson(
      resp.hits.hits,
      latField,
      longField,
      propertyFields
    )
  })
}

function toRoadsDict (json) {
  let dict = {}
  let buckets = json.aggregations.group_by.buckets
  buckets.forEach(function (bucket) {
    let geometryString = _.get(bucket, 'top_agg_hits.hits.hits[0]._source.geojson', undefined)
    if (geometryString !== undefined) {
      let geometry = JSON.parse(geometryString)
      dict[bucket.key] = {
        geometry: geometry,
        count: bucket.doc_count
      }
    }
  })
  return dict
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
              criteriaFilters.push({ term: f })
            }
          }
          if (criteriaFilters.length === 0) {
            // ~hack~ rien n'est coché : pas de résultats attendus
            let f = {}
            f[criteria[fieldName]] = -1
            criteriaFilters.push({ term: f })
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

function generateAggs (type, fieldName, size, topAgghitsField = null) {
  // Génère le champ aggrégation de la requête ES
  let aggs = {
    group_by: {
      terms: {
        field: fieldName,
        size: size,
        collect_mode: 'breadth_first'
      }
    }
  }

  if (topAgghitsField) {
    aggs.group_by.aggs = {
      top_agg_hits: {
        top_hits: {
          _source: {
            include: [
              topAgghitsField
            ]
          },
          size: 1
        }
      }
    }
  }

  return aggs
}

function getQueryBase (size) {
  return {
    size: size,
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

function addAdditionalFilters (must, type, view) {
  if (view.data.filter.activated) {
    let filterName = aggregationLevelsInfos.data[type][view.data.filter.filterCriteria]
    addFilter(must, filterName, view.data.filter.value)
  }
}

function addFilter (must, field, value) {
  let f = {}
  f[field] = value
  must.push({
    bool: {
      should: [{term: f}]
    }
  })
}

function generateAggregatedQuery (criteriaList, type, view, topAgghitsField = null) {
  // Génération de la query ES
  let query = getQueryBase(0)
  let must = generateFilter(criteriaList, type)
  addAdditionalFilters(must, type, view)
  let aggKey = aggregationLevelsInfos.data[type][view.data.group_by]
  let aggs = generateAggs(type, aggKey, 1000, topAgghitsField)

  query.query.constant_score.filter.bool.must = must
  query.aggs = aggs

  return query
}

function generateGraphAgg (criteriaList, type, view, roadID, aggKey) {
  let query = getQueryBase(0)
  let must = generateFilter(criteriaList, type)
  addAdditionalFilters(must, type, view)
  addFilter(must, aggregationLevelsInfos.data[type][view.data.group_by], roadID)
  let aggs = generateAggs(type, aggKey, 100)
  query.query.constant_score.filter.bool.must = must
  query.aggs = aggs

  return query
}

function generateQuery (criteriaList, type, view) {
  // Génération de la query ES
  let query = getQueryBase(10000)
  let must = []
  if (criteriaList) {
    must = generateFilter(criteriaList, type)
  }
  addAdditionalFilters(must, type, view)
  query.query.constant_score.filter.bool.must = must
  return query
}

function generateAggregatedQueryByFilter (criteriaList, type, view) {
  let promises = []
  let criteriaPaths = []
  let fieldNameType = type === 'pve' ? 'field_name_pve' : 'field_name_acc'
  for (let scopeName in criteriaList) {
    let scope = criteriaList[scopeName]
    for (let criteriaName in scope) {
      let criteria = scope[criteriaName]
      if (fieldNameType in criteria) {
        let criteriaPath = scopeName + '.' + criteriaName
        let query = getQueryBase(0)
        let must = generateFilter(criteriaList, type, criteriaPath)
        let fieldName = criteria[fieldNameType]
        let aggs = generateAggs(type, fieldName, 150)

        addAdditionalFilters(must, type, view)
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
      for (let b of value.aggregations.group_by.buckets) {
        res[criteriaPaths[i] + '.' + b['key']] = b['doc_count']
      }
    })
    return res
  })
}

function generateGeoJson (hits, latField, longField, propertyFields) {
  let features = []
  for (let hit of hits) {
    let long = parseFloat(hit._source[longField])
    let lat = parseFloat(hit._source[latField])
    if (long && lat) {
      let properties = {}
      for (let prop in propertyFields) {
        properties[prop] = hit._source[propertyFields[prop]]
      }
      features.push({
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [long, lat]},
        properties: properties
      })
    }
  }
  return {
    type: 'FeatureCollection',
    features: features
  }
}

function getCommunesGeoJson (dep) {
  let query = {
    size: 1000,
    _source: [
      'Population',
      'Commune',
      'Code INSEE',
      'Code Département',
      'latitude',
      'longitude'
    ],
    query: {
      constant_score: {
        filter: {
          bool: {
            must: [{
              bool: {
                should: [{
                  term: {
                    'Code Département': dep
                  }
                }]
              }
            }]
          }
        }
      }
    }
  }
  return searchAsGeoJson('commune', query, 'latitude', 'longitude', communesGeoJsonFields)
}

function searchSimpleFilter (type, field, ref) {
  let term = {}
  term[field] = ref

  let query = {
    size: 100,
    query: {
      constant_score: {
        filter: {
          bool: {
            must: [{
              term: term
            }]
          }
        }
      }
    }
  }
  return search(type, query)
}
