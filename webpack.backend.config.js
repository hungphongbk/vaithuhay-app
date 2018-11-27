const path = require('path')
const webpack = require('webpack'),
  merge = require('webpack-merge'),
  base = require('./webpack/base.config.js'),
  nodeExternals = require('webpack-node-externals')
const isProd = process.env.NODE_ENV === 'production'

module.exports = merge(base, {
  target: 'node',
  entry: {
    'app-build': './server/app.js',
    test: './server/testcli.js'
  },
  output: {
    path: path.resolve(__dirname, './server'),
    filename: '[name]' + (isProd ? '.prod' : '.dev') + '.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'server'), // your scripts
          path.resolve(__dirname, 'node_modules/query-string')
          // path.resolve(__dirname, "node_modules/query-string")
        ],
        use: [
          {
            loader: 'babel-loader?cacheDirectory',
            options: {
              babelrc: false,
              presets: [
                [
                  'env',
                  {
                    loose: true
                  }
                ],
                [
                  'es2015',
                  {
                    loose: true
                  }
                ]
              ],
              plugins: [
                'transform-object-rest-spread',
                'transform-runtime',
                'transform-regenerator',
                'transform-async-functions',
                'transform-decorators-legacy',
                'transform-flow-strip-types',
                [
                  'transform-class-properties',
                  {
                    spec: true
                  }
                ]
              ]
            }
          },
          'remove-hashbag-loader'
        ]
      },
      {
        // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
        test: /\.tsx?$/,
        loader: 'cache-loader!ts-loader'
      }
    ]
  },
  node: {
    __filename: true,
    __dirname: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  resolveLoader: {
    alias: {
      'remove-hashbag-loader': path.join(
        __dirname,
        './webpack/remove-hashbag-loader'
      )
    }
  },
  externals: [
    nodeExternals({
      modulesFromFile: {
        exclude: ['devDependencies']
      }
    })
  ],
  performance: {
    hints: false
  }
})

// http://vue-loader.vuejs.org/en/workflow/production.html
module.exports.plugins = [
  ...[/vertx/, /bufferutil/, /utf-8-validate/].map(
    reg => new webpack.IgnorePlugin(reg)
  ),
  new webpack.IgnorePlugin(/(locale)/, /node_modules.+(moment)/),
  ...(isProd
    ? [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: '"production"'
          }
        })
        // require('./webpack/completed')
      ]
    : [])
]
