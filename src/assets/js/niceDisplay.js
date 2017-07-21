export default { niceDisplay, capitalize }

function isNumber (n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

function format (n) {
  return n.toLocaleString('fr-FR', {
    maximumSignificantDigits: 3
  })
}

function niceDisplay (n) {
  // Met en forme les nombre joliment et correctement typographiquement
  if (!isNumber(n)) {
    return n
  } else if (n > 1000 * 1000) {
    return format(n / 1000000) + ' M'
  } else if (n > 1000) {
    return format(n / 1000) + ' k'
  } else if (n > 1) {
    return format(n)
  } else {
    return format(n * 1000) + ' ‰'
  }
}

function capitalize (s) {
  return s.replace(/\b\w/, l => l.toUpperCase())
}
