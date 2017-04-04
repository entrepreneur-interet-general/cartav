export default { niceDisplay }

function niceDisplay (n) {
  // Gère l'affichage des nombres dans les clusters
  if (n > 1000000) {
    n = Math.round(n / 10000) / 100 + 'm'
  }
  if (n > 10000) {
    n = Math.round(n / 1000) + 'k'
  }
  if (n > 1000) {
    n = Math.round(n / 100) / 10 + 'k'
  }
  if (n > 10) {
    n = Math.round(n * 10) / 10
  }
  if (n > 1) {
    n = Math.round(n * 100) / 100
  }
  if (n < 1) {
    let k = Math.round(-Math.log(n))
    n = Math.round(n * Math.pow(10, k)) / Math.pow(10, k)
  }
  return n
}
