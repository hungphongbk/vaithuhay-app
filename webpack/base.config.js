const path = require('path')

module.exports = {
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, '../')],
    alias: {
      '@client': path.resolve(__dirname, '../src'),
      '@server': path.resolve(__dirname, '../server'),
      '@universal': path.resolve(__dirname, '../universal')
    }
  }
}
