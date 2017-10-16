import elasticsearch from 'elasticsearch'
import _ from 'lodash'
import aggregationLevelsInfos from '../../assets/json/aggregationLevelsInfos'
import constants from './constants'

export default { search, searchAsGeoJsonPoints, searchAsGeoJsonGeom, generateQuery, generateAggregatedQuery, generateAggregatedQueryByFilter, querySimpleFilter, searchSimpleFilter, toRoadsDict, generateGraphAgg, keysList }

const index = process.env.indices

const client = new elasticsearch.Client({
  host: process.env.ES_HOST,
  apiVersion: '5.x'
})

function search (type, query) {
  return client.search({
    index: index[type],
    body: query
  })
}

function searchAsGeoJsonPoints (type, query, latField, longField, propertyFields) {
  return search(type, query).then(resp => generateGeoJsonPoints(resp.hits.hits,
                                                                latField,
                                                                longField,
                                                                propertyFields)
  )
}

function searchAsGeoJsonGeom (type, query, geomField, propertyFields) {
  return search(type, query).then(resp => generateGeoJsonGeom(resp.hits.hits,
                                                              geomField,
                                                              propertyFields)
  )
}

function keysList (type, fieldName, size) {
  const query = {
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
  const dict = {
    type: 'FeatureCollection',
    features: []
  }
  const buckets = json.aggregations.group_by.buckets
  buckets.forEach(function (bucket) {
    const geometryString = _.get(bucket, 'top_agg_hits.hits.hits[0]._source.geojson', undefined)
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
  const fieldName = type === constants.PVE ? 'field_name_pve' : 'field_name_acc'
  const must = []
  if (type === constants.PVE || type === constants.ACC) {
    const field = criteriaList['PV électroniques et accidents']['Période temporelle'][fieldName]
    must.push({
      range: {
        [field]: {
          gte: dates[type][0],
          lt: dates[type][1],
          format: 'yyyy-MM-dd'
        }
      }
    })
  }

  for (const scopeName in criteriaList) {
    const scope = criteriaList[scopeName]
    for (const criteriaName in scope) {
      const criteria = scope[criteriaName]
      if (fieldName in criteria && !criteria.specificFilter) {
        const criteriaPath = scopeName + '.' + criteriaName
        if (criteriaPath !== ExceptThisfield) {
          const criteriaFilters = []
          for (const valueName in criteria.values) {
            if (criteria.values[valueName]) {
              criteriaFilters.push({
                term: {
                  [criteria[fieldName]]: valueName
                }
              })
            }
          }
          if (criteriaFilters.length === 0) {
            // ~hack~ rien n'est coché : pas de résultats attendus
            criteriaFilters.push({
              term: {
                [criteria[fieldName]]: -1
              }
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
  if (services) {
    const criteriaFilters = []
    for (const service of services.list) {
      criteriaFilters.push({
        term: {
          [services.fieldName]: service
        }
      })
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
  const aggs = {
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

function getQueryBase (size, sourceFiltering = null) {
  const q = {
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
  if (sourceFiltering) { q._source = sourceFiltering }
  return q
}

function addAdditionalFilters (must, type, view) {
  if (view.data.filter.activated) {
    const filterName = aggregationLevelsInfos.data[type][view.data.filter.filterCriteria]
    addFilter(must, filterName, view.data.filter.value)
  }
}

function addFilter (must, field, value) {
  must.push({
    bool: {
      should: [{
        term: {
          [field]: value
        }
      }]
    }
  })
}

function generateAggregatedQuery (criteriaList, dates, services, type, view, topAgghitsField = null) {
  // Génération de la query ES
  const query = getQueryBase(0)
  const must = generateFilter(criteriaList, dates, services, type)
  addAdditionalFilters(must, type, view)
  const aggKey = aggregationLevelsInfos.data[type][view.data.group_by]
  // 73000 = nombre de rues dans le departement qui en a le plus (29)
  const aggs = generateAggs(type, aggKey, 73000, topAgghitsField)
  query.query.constant_score.filter.bool.must = must
  query.aggs = aggs

  return query
}

function generateGraphAgg (criteriaList, dates, services, type, view, roadID, aggKey) {
  const query = getQueryBase(0)
  const must = generateFilter(criteriaList, dates, services, type)
  addAdditionalFilters(must, type, view)
  addFilter(must, aggregationLevelsInfos.data[type][view.data.group_by], roadID)
  const aggs = generateAggs(type, aggKey, 100)
  query.query.constant_score.filter.bool.must = must
  query.aggs = aggs

  return query
}

function generateQuery (criteriaList, dates, services, type, view, sourceFiltering = null, roadID = null) {
  // Génération de la query ES
  const query = getQueryBase(10000, sourceFiltering)
  const must = criteriaList ? generateFilter(criteriaList, dates, services, type) : []

  if (roadID) {
    addFilter(must, aggregationLevelsInfos.data[type][view.data.group_by], roadID)
  }
  addAdditionalFilters(must, type, view)
  query.query.constant_score.filter.bool.must = must
  return query
}

function generateAggregatedQueryByFilter (criteriaList, dates, services, type, view) {
  const promises = []
  const criteriaPaths = []
  const fieldNameType = type === constants.PVE ? 'field_name_pve' : 'field_name_acc'
  for (const scopeName in criteriaList) {
    const scope = criteriaList[scopeName]
    for (const criteriaName in scope) {
      const criteria = scope[criteriaName]
      if (fieldNameType in criteria && !criteria.specificFilter) {
        const criteriaPath = scopeName + '.' + criteriaName
        const query = getQueryBase(0)
        const must = generateFilter(criteriaList, dates, services, type, criteriaPath)
        const fieldName = criteria[fieldNameType]
        const aggs = generateAggs(type, fieldName, 150)

        addAdditionalFilters(must, type, view)
        query.query.constant_score.filter.bool.must = must
        query.aggs = aggs
        promises.push(search(type, query))
        criteriaPaths.push(criteriaPath)
      }
    }
  }
  return Promise.all(promises).then(function (values) {
    const res = {}
    values.forEach(function (value, i) {
      for (const b of value.aggregations.group_by.buckets) {
        res[criteriaPaths[i] + '.' + b['key']] = b['doc_count']
      }
    })
    return res
  })
}

function generateGeoJsonGeom (hits, geomField, propertyFields) {
  const features = []
  for (const hit of hits) {
    const properties = {}
    for (const prop in propertyFields) {
      properties[prop] = hit._source[propertyFields[prop]]
    }
    features.push({
      type: 'Feature',
      geometry: JSON.parse(hit._source[geomField]),
      properties: properties
    })
  }
  return {
    type: 'FeatureCollection',
    features: features
  }
}

function generateGeoJsonPoints (hits, latField, longField, propertyFields) {
  const features = []
  for (const hit of hits) {
    const long = parseFloat(hit._source[longField])
    const lat = parseFloat(hit._source[latField])
    if (long && lat) {
      const properties = {}
      for (const prop in propertyFields) {
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

function querySimpleFilter (field, ref, size = 1000) {
  return {
    size: size,
    query: {
      constant_score: {
        filter: {
          bool: {
            must: [{
              term: {
                [field]: ref
              }
            }]
          }
        }
      }
    }
  }
}

function searchSimpleFilter (type, field, ref) {
  const query = querySimpleFilter(field, ref)
  return search(type, query)
}
