import elasticsearch from 'elasticsearch'

var client = new elasticsearch.Client({
  host: 'http://10.237.27.129:80',
  apiVersion: '2.2'
})

function search (type, query) {
  let index = type === 'pve' ? 'es2_2010_2015_pve_sr' : 'es2_2005_2015_accidents_caracteristiques_lieux'
  console.log(type)
  console.log(query)
  return client.search({
    index: index,
    body: query
  })
}

export default { search }
