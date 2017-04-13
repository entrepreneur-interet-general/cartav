import elasticsearch from 'elasticsearch'
import _ from 'lodash'

export default { search, searchAsGeoJson, generateQuery, generateAggregatedQuery, generateAggregatedQueryByFilter, getFieldsMap, getCommunesGeoJson, searchSimpleFilter, toMultiLineGeojson }

function getFieldsMap () {
  return {
    'acc': {
      'région': 'NOM_REG.NOM_REG_facet',
      'département': 'dep',
      'commune': 'current_city_code',
      'local': 'num_route_or_id.num_route_or_id_facet'
    },
    'pve': {
      'région': 'NOM_REG.NOM_REG_facet',
      'département': 'DEPARTEMENT_INFRACTION',
      'commune': 'CODE_INSEE_INFRACTION',
      'local': 'num_route_or_id.num_route_or_id_facet'
    }
  }
}

let communesGeoJsonFields = {
  Population: 'Population',
  nom: 'Commune',
  code: 'Code INSEE',
  CODE_DEPT: 'Code Département'
}

function getIndex () {
  return {
    acc: 'es2_2005_2015_accidents',
    pve: 'es2_2010_2015_pve_sr2',
    commune: 'es2_2016_geohisto_communes_complete2',
    acc_usagers: 'es2_accidents_usagers',
    acc_vehicules: 'es2_accidents_vehicules'
  }
}

let client = new elasticsearch.Client({
  host: 'http://10.237.27.129:80',
  apiVersion: '2.2'
})

function search (type, query) {
  let index = getIndex()[type]
  // console.log(query)
  return client.search({
    index: index,
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

function toMultiLineGeojson (json) {
  // console.log(json)
  let buckets = json.aggregations.group_by.buckets
  // console.log(buckets)
  let features = []
  buckets.forEach(function (bucket) {
    // console.log(bucket.top_agg_hits.hits.hits[0]._source.geojson)
    // console.log(JSON.parse(bucket.top_agg_hits.hits.hits[0]._source.geojson))
    let geojsonString = _.get(bucket, 'top_agg_hits.hits.hits[0]._source.geojson', undefined)
    if (geojsonString !== undefined) {
      let geojson = JSON.parse(geojsonString)
      let feature = {
        type: 'Feature',
        geometry: geojson,
        properties: {
          name: bucket.key,
          count: bucket.doc_count
        }
      }
      features.push(feature)
    }
  })
  // console.log(features)
  let geoJson = {
    type: 'FeatureCollection',
    features: features
  }
  // console.log(geoJson)
  return geoJson
}

function generateFilter (criteriaList, type, ExceptThisfield = undefined) {
  // Lit les critères cochés et génère la requête ES correspondante
  let fieldName = type === 'pve' ? 'field_name_pve' : 'field_name_acc'
  var must = []

  // console.log('CL')
  // console.log(criteriaList)

  for (let scopeName in criteriaList) {
    let scope = criteriaList[scopeName]
    /* if (scopeName === 'Accidents' && ExceptThisfield === undefined) {
      console.log('scope1')
      console.log(scope)
    } */
    for (let criteriaName in scope) {
      let criteria = scope[criteriaName]
      /* if (scopeName === 'Accidents' && criteriaName === 'Heure' && ExceptThisfield === undefined) {
        console.log('scope2')
        console.log(scope)
        console.log('criteria.values')
        console.log(criteria.values)
        console.log('scope.Heure.values')
        console.log(scope.Heure.values)
      } */
      if (fieldName in criteria) {
        let criteriaPath = scopeName + '.' + criteriaName
        if (criteriaPath !== ExceptThisfield) {
          let criteriaFilters = []
          for (let valueName in criteria.values) {
            /* if (criteriaName === 'Heure' && ExceptThisfield === undefined) {
              console.log(criteria.values[valueName])
            } */
            if (criteria.values[valueName]) {
              // console.log(criteria.values[valueName])
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

function generateAggs (type, fieldName, size, sourceField = null) {
  // Génère le champ aggrégation de la requête ES
  let aggs = {
    group_by: {
      terms: {
        field: fieldName,
        size: size
      }
    }
  }

  if (sourceField) {
    aggs.group_by.aggs = {
      top_agg_hits: {
        top_hits: {
          _source: {
            include: [
              sourceField
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

function addAdditionalFilters (must, type, crit) {
  if (crit.level && crit.id) {
    let filterName = getFieldsMap()[type][crit.level]
    let f = {}
    f[filterName] = crit.id
    must.push({
      bool: {
        should: [{term: f}]
      }
    })
  }
}

function generateAggregatedQuery (criteriaList, type, level, additionalCriteria, sourceField = null) {
  // Génération de la query ES
  let query = getQueryBase(0)
  let must = generateFilter(criteriaList, type)
  addAdditionalFilters(must, type, additionalCriteria)
  let aggKey = getFieldsMap()[type][level]
  let aggs = generateAggs(type, aggKey, 1000, sourceField)

  query.query.constant_score.filter.bool.must = must
  query.aggs = aggs

  return query
}

function generateQuery (criteriaList, type, additionalCriteria) {
  // Génération de la query ES
  let query = getQueryBase(10000)
  console.log('coucou')
  let must = generateFilter(criteriaList, type)
  addAdditionalFilters(must, type, additionalCriteria)

  query.query.constant_score.filter.bool.must = must

  return query
}

function generateAggregatedQueryByFilter (criteriaList, type, additionalCriteria) {
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

        addAdditionalFilters(must, type, additionalCriteria)
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

function generateGeoJson (hits, latField, longField, propertyFields) {
  let features = []
  let geoJson = {'type': 'FeatureCollection',
    'features': features
  }
  console.log('je geojsonne')
  for (let hit of hits) {
    let long = parseFloat(hit._source[longField])
    let lat = parseFloat(hit._source[latField])
    if (long && lat) {
      let properties = {}
      for (let prop in propertyFields) {
        properties[prop] = hit._source[propertyFields[prop]]
      }
      features.push({'type': 'Feature',
        'geometry': {'type': 'Point', 'coordinates': [long, lat]},
        'properties': properties
      })
    }
  }
  // console.log('fini !')
  return geoJson
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
      'constant_score': {
        'filter': {
          'bool': {
            'must': [
              {
                'bool': {
                  'should': [
                    {
                      'term': {
                        'Code Département': dep
                      }
                    }
                  ]
                }
              }
            ]
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
            must: [
              {
                term: term
              }
            ]
          }
        }
      }
    }
  }
  return search(type, query)
}
