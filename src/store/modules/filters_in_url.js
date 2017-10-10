import _ from 'lodash'

export default { encodeFilters, decodeFilters }

// 2⁶ = 64 charactères :
const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZéà0123456789'

function encodeFilters (filters) {
  let res = ''
  let count = 0
  for (const category in filters) {
    for (const criteria in filters[category]) {
      const values = filters[category][criteria].values
      for (const value in values) {
        if (count === 6) {
          res += '|'
          count = 0
        }
        res += values[value] ? '1' : '0'
        count++
      }
    }
  }
  // res est completé avec des 0 pour avoir une taille multiple de 6
  for (let i = 0; i < 6 - count; ++i) {
    res += '0'
  }
  // res est découpé en paquets de 6
  // chaque paquet de 6 est converti en nombre décimal
  // l'indice correspondant est cherché dans chars
  return _.map(res.split('|'), s => chars[parseInt(s, 2)]).join('')
}

function decodeFilters (filters, encodedFilters) {
  let binaryFilters = ''
  for (const c of encodedFilters) {
    // on prend chaque lettre de encodedFilters
    // son indice est recherché dans chars, puis converti en binaire
    // on rajoutte des 0 en padding
    binaryFilters += ('000000' + chars.indexOf(c).toString(2)).slice(-6)
  }
  for (const category in filters) {
    for (const criteria in filters[category]) {
      const values = filters[category][criteria].values
      for (const value in values) {
        values[value] = binaryFilters[0] === '1'
        binaryFilters = binaryFilters.slice(1)
      }
    }
  }
  return filters
}
