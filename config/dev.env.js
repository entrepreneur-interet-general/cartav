var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  PATH: '"/av/test"',
  indices: {
    acc: '"es5dev_2005_2015_accidents"',
    pve: '"es5dev_2014_2015_pve"',
    acc_usagers: '"es5dev_accidents_usagers"',
    acc_vehicules: '"es5dev_accidents_vehicules"',
    radars: '"es5dev_radars"',
    communes: '"es5dev_communes_boundaries"'
  }
})
