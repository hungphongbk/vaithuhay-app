const path = require('path');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
//import webpack from 'webpack';

module.exports = {
  mode: 'production',
  target: 'node',
  context: process.cwd(),
  entry: {
    index: path.resolve(__dirname, 'app/index.js')
  },
  output: {
    path: __dirname,
    filename: 'index.js',
    libraryTarget: "umd"
  },
  module: {
    rules: [
      {
        test: /\.js$/, exclude: /node_modules/, use: [
          {
            loader: 'babel-loader?cacheDirectory',
            options: {
              babelrc: false,
              presets: [
                ['env', {
                  loose: true
                }]
              ],
              plugins: [
                'transform-object-rest-spread',
                'transform-runtime',
                'transform-regenerator',
                'transform-async-functions',
                'transform-decorators-legacy',
                "transform-flow-strip-types"
              ]
            }
          }
        ]
      },
      // {test: /\.ts$/, loader: "ts-loader"}
      // {test: /\.json$/, loader: "json-loader"}
    ]
  },
  resolve: {
    extensions: [".ts", ".js", ".json"]
  },
  node: {
    __filename: true,
    __dirname: true
  },
  externals: [nodeExternals({
    whitelist: [
      /^lodash/,
      'atob', 'btoa'
    ]
  })],
  plugins: [
    ...[/vertx/, /bufferutil/, /utf-8-validate/].map(reg => new webpack.IgnorePlugin(reg)),
  ]
};
