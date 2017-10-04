import elasticsearch from 'elasticsearch'
import _ from 'lodash'
import aggregationLevelsInfos from '../../assets/json/aggregationLevelsInfos'

export default { search, searchAsGeoJson, generateQuery, generateAggregatedQuery, generateAggregatedQueryByFilter, getCommunesGeoJson, searchSimpleFilter, toRoadsDict, generateGraphAgg, keysList }

let communesGeoJsonFields = {
  Population: 'Population',
  nom: 'Commune',
  code: 'Code INSEE',
  CODE_DEPT: 'Code Département'
}

let index = process.env.indices

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

function keysList (type, fieldName, size) {
  let query = {
    size: 0,
    aggs: {
      group_by: {
        terms: {
          field: fieldName,
          size: size
        }
      }
    }
  }
  return search(type, query)
    .then(resp => resp.aggregations.group_by.buckets.map(bucket => bucket.key))
}

function toRoadsDict (json, otherCount) {
  let dict = {
    type: 'FeatureCollection',
    features: []
  }
  let buckets = json.aggregations.group_by.buckets
  buckets.forEach(function (bucket) {
    let geometryString = _.get(bucket, 'top_agg_hits.hits.hits[0]._source.geojson', undefined)
    if (geometryString !== undefined) {
      dict.features.push({
        geometry: JSON.parse(geometryString),
        type: 'Feature',
        properties: {
          count: bucket.doc_count,
          nom_route: _.get(bucket, 'top_agg_hits.hits.hits[0]._source.num_route_or_id', undefined),
          id: bucket.key,
          otherCount: otherCount[bucket.key] || 0
        }
      })
    }
  })
  return dict
}

function generateFilter (criteriaList, dates, services, type, ExceptThisfield = undefined) {
  // Lit les critères cochés et génère la requête ES correspondante
  let fieldName = type === 'pve' ? 'field_name_pve' : 'field_name_acc'
  var must = []

  if (type === 'pve' || type === 'acc') {
    let range = {}
    let field = criteriaList['PV électroniques et accidents']['Période temporelle'][fieldName]
    range[field] = {
      gte: dates[type][0],
      lt: dates[type][1],
      format: 'yyyy-MM-dd'
    }
    must.push({range: range})
  }

  for (let scopeName in criteriaList) {
    let scope = criteriaList[scopeName]
    for (let criteriaName in scope) {
      let criteria = scope[criteriaName]
      if (fieldName in criteria && !criteria.specificFilter) {
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
  if (services) {
    let criteriaFilters = []
    for (let service of services.list) {
      let f = {}
      f[services.fieldName] = service
      criteriaFilters.push({ term: f })
    }
    must.push({
      bool: {
        should: criteriaFilters
      }
    })
  }
  return must
}

function generateAggs (type, fieldName, size, topAgghitsFields = null) {
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

  if (topAgghitsFields) {
    aggs.group_by.aggs = {
      top_agg_hits: {
        top_hits: {
          _source: {
            include: topAgghitsFields
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

function generateAggregatedQuery (criteriaList, dates, services, type, view, topAgghitsField = null) {
  // Génération de la query ES
  let query = getQueryBase(0)
  let must = generateFilter(criteriaList, dates, services, type)
  addAdditionalFilters(must, type, view)
  let aggKey = aggregationLevelsInfos.data[type][view.data.group_by]
  // 73000 = nombre de rues dans le departement qui en a le plus (29)
  let aggs = generateAggs(type, aggKey, 73000, topAgghitsField)

  query.query.constant_score.filter.bool.must = must
  query.aggs = aggs

  return query
}

function generateGraphAgg (criteriaList, dates, services, type, view, roadID, aggKey) {
  let query = getQueryBase(0)
  let must = generateFilter(criteriaList, dates, services, type)
  addAdditionalFilters(must, type, view)
  addFilter(must, aggregationLevelsInfos.data[type][view.data.group_by], roadID)
  let aggs = generateAggs(type, aggKey, 100)
  query.query.constant_score.filter.bool.must = must
  query.aggs = aggs

  return query
}

function generateQuery (criteriaList, dates, services, type, view, roadID = null) {
  // Génération de la query ES
  let query = getQueryBase(10000)
  let must = []
  if (criteriaList) {
    must = generateFilter(criteriaList, dates, services, type)
  }
  if (roadID) {
    addFilter(must, aggregationLevelsInfos.data[type][view.data.group_by], roadID)
  }
  addAdditionalFilters(must, type, view)
  query.query.constant_score.filter.bool.must = must
  return query
}

function generateAggregatedQueryByFilter (criteriaList, dates, services, type, view) {
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
        let must = generateFilter(criteriaList, dates, services, type, criteriaPath)
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
