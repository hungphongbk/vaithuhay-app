const path = require('path')
const webpack = require('webpack'),
  merge = require('webpack-merge'),
  base = require('./webpack/base.config.js'),
  nodeExternals = require('webpack-node-externals'),
  glob = require('glob'),
  yenv = require('yenv')

const _envs = yenv(path.resolve(process.cwd(), 'config/env.yaml'), {
    env: 'web-production'
  }),
  envs = {}
for (const env of [
  'APP_HOST',
  'NODE_ENV',
  'HRV_THEME_M_ID',
  'HRV_THEME_D_ID'
]) {
  envs[env] = JSON.stringify(_envs[env])
}
const isProd = process.env.NODE_ENV === 'production'

function camelToKebab(input) {
  return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

const babelLoaders = (additionalBabelPlugins = []) => [
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
          ],
          ...additionalBabelPlugins
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
  ],
  processEntries = glob
    .sync('./server/**/*.process.js')
    .reduce((entries, entry) => {
      const match = /\/([\w\d-_]+)\.process\.js$/.exec(entry)
      // console.log(match)
      if (match !== null && typeof match[1] !== 'undefined') {
        entries[camelToKebab(match[1])] = entry
      }
      return entries
    }, {})
// console.log(processEntries)

module.exports = merge(base, {
  target: 'node',
  entry: {
    'app-build': './server/app.js',
    test: './server/testcli.js',
    ...processEntries
  },
  output: {
    path: path.resolve(__dirname, './server-dist'),
    filename: '[name]' + (isProd ? '.prod' : '.dev') + '.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.js$/,
            include: [
              path.resolve(__dirname, 'server'), // your scripts
              path.resolve(__dirname, 'node_modules/query-string')
              // path.resolve(__dirname, "node_modules/query-string")
            ],
            use: babelLoaders()
          },
          {
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            test: /\.tsx?$/,
            loader: 'cache-loader!ts-loader'
          }
        ]
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
  externals: [nodeExternals()],
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
          'process.env': envs
        }),
        new webpack.optimize.UglifyJsPlugin({
          sourceMap: true,
          compress: {
            warnings: false
          }
        })
        // require('./webpack/completed')
      ]
    : [])
]
