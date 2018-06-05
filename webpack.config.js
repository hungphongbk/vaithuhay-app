const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin'),
  merge = require('webpack-merge'),
  base = require('./webpack/base.config.js');
  // MyUtils = require('hungphongbk-utils');


const devMode = process.env.NODE_ENV === 'development',
  serverName = devMode ? '' : 'https://server.vaithuhay.com/dist/',
  cssLoader = (loaders) => {
    if (devMode) {
      loaders.unshift('style-loader');
      return loaders
    } else {
      return ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: loaders
      })
    }
  };

module.exports = merge(base, {
  entry: {
    main: ['regenerator-runtime/runtime', './src/main']
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: serverName,
    filename: 'build.js?[hash]',
    chunkFilename: '[name].bundle.js?[chunkhash]',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
            // the "scss" and "sass" values for the lang attribute to the right configs here.
            // other preprocessors should work out of the box, no loader config like this necessary.
            'scss': 'vue-style-loader!css-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
            'docs': require.resolve(path.join(__dirname, 'webpack/docs-loader.js')),
            'js': 'babel-loader?cacheDirectory'
          }
          // other vue-loader options go here
        }
      },
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, "src"), // your scripts
          path.resolve(__dirname, "node_modules/query-string"),
          path.resolve(__dirname, "node_modules/strict-uri-encode"),
        ],
        loader: 'babel-loader?cacheDirectory'
      },
      {
        test: /\.css$/,
        use: cssLoader(['css-loader'])
      },
      {
        test: /\.scss$/,
        use: cssLoader(['cache-loader', 'css-loader', 'sass-loader'])
      },
      {test: /\/ckeditor5-.*\.svg$/, loader: 'raw-loader'},
      {
        test: /\.(png|jpg|gif)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.svg$/,
        loader: 'file-loader',
        exclude: /\/ckeditor5-/,
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: '[sha512:hash:base64:8].[ext]'
        }
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map'
})
module.exports.plugins = [
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    'window.jQuery': 'jquery',
    Popper: ['popper.js', 'default'],
    'moment': 'moment',
    'window.moment': 'moment'
  }),
  new webpack.IgnorePlugin(/(locale)/, /node_modules.+(moment)/),
  new HtmlWebpackPlugin({
    template: './index.src.html',
    filename: devMode ? 'index.html' : '../index.html'
  })
];
if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map';
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new ExtractTextPlugin("styles.css?[contenthash]"),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: 3,
      children: true
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      parallels: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    // MyUtils.SftpSync({
    //   localPath: path.resolve(__dirname, 'dist'),
    //   remotePath: '/home/phong/api.v1/vaithuhay/dist'
    // })
  ])
}
