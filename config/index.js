// see http://vuejs-templates.github.io/webpack for documentation.
var path = require('path')
var assetsPublicPath, es_conf
if (process.env.prod_type === 'production') {
  assetsPublicPath = '/av/'
  es_conf = './prod.env'
} else if (process.env.prod_type === 'pre-production') {
  assetsPublicPath = '/av/test/'
  es_conf = './pre-prod.env'
}

module.exports = {
  build: {
    env: require(es_conf),
    index: path.resolve(__dirname, '../dist/index.html'),
    assetsRoot: path.resolve(__dirname, '../dist'),
    assetsSubDirectory: 'static',
    productionSourceMap: true,
    assetsPublicPath: assetsPublicPath,
    // Gzip off by default as many popular static hosts such as
    // Surge or Netlify already gzip all static assets for you.
    // Before setting to `true`, make sure to:
    // npm install --save-dev compression-webpack-plugin
    productionGzip: false,
    productionGzipExtensions: ['js', 'css']
  },
  dev: {
    env: require('./dev.env'),
    port: 8080,
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    proxyTable: {},
    // CSS Sourcemaps off by default because relative paths are "buggy"
    // with this option, according to the CSS-Loader README
    // (https://github.com/webpack/css-loader#sourcemaps)
    // In our experience, they generally work as expected,
    // just be aware of this issue when enabling this option.
    cssSourceMap: false
  }
}
