const isNumber = n => !isNaN(parseFloat(n)) && isFinite(n)
const localStringSupport = !!(typeof Intl === 'object' && Intl && typeof Intl.NumberFormat === 'function')
const format = function (n) {
  if (localStringSupport) {
    return n.toLocaleString('fr-FR', { maximumSignificantDigits: 3 })
  } else {
    return Math.round(n * 1000) / 1000
  }
}

function niceDisplay (n) {
  // Met en forme les nombre joliment et correctement typographiquement
  if (!isNumber(n)) {
    return n
  } else if (n > 1000 * 1000) {
    return format(n / 1000000) + ' M'
  } else if (n > 1000) {
    return format(n / 1000) + ' k'
  } else if (n >= 0.1) {
    return format(n)
  } else {
    return format(n * 1000) + ' ‰'
  }
}

// Met une majuscule à la première lettre
const capitalize = s => s.replace(/\b\w/, l => l.toUpperCase())

export default { niceDisplay, capitalize }
