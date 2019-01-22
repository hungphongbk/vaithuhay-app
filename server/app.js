import url from 'url'

require('@server/core/env')('web')

import MetafieldsSocketRouter from '@server/socket-routes/Metafields'
import UploadImages from '@server/socket-routes/UploadImages'
import HaravanClientApi from '@server/utils/HaravanClientAPI'
import Settings from '@server/components/Settings'

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason.message, 'Unhandled Rejection at Promise')
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown')
    // process.exit(1);
  })

const express = require('express')
import connectMongoose from './core/mongoose'
const path = require('path')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
import sessionComponent from './components/session'
import cors from 'cors'
import * as models from '@server/models'
import index from '@server/routes/global'
import products from '@server/routes/products'
import translate from '@server/routes/translate'
import image from '@server/routes/image'
import google from '@server/routes/google'
import collections from '@server/routes/collections'
import social from '@server/routes/social'
import user from '@server/routes/user'
// import pushNoti from '@server/routes/push-notification'
import HaravanHooks from '@server/routes/haravanHooks'
import FacebookHooks from '@server/routes/facebookHooks'
import ssr from '@server/routes/ssr'
import Promotions, {
  bootstrap as promotionsBootstrap
} from '@server/routes/promotions'
import { socketMiddleware } from './routes/middlewares'
import { createServer } from './utils'
//passport with social
import './auth/facebook'
import googleAnalyticsJob from '@server/jobs/GoogleAnalytics'
import updateProductJson from '@server/jobs/updateProductJson'

// mongoose
connectMongoose()
  .then(() => {
    console.log('Completed setup Vaithuhay MongoDB')
  })
  .catch(err => {
    console.error('Error when setup Vaithuhay MongoDB')
    console.error(err.message)
  })
// )

const app = express(),
  { server, io } = createServer(app, [promotionsBootstrap])

UploadImages.create(io, 'upload')
MetafieldsSocketRouter.create(io, 'metafields')

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
sessionComponent(app)
app.use(logger('dev'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.text())
app.use(bodyParser.json())
app.use(cookieParser())
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (/vaithuhay.com/.test(origin)) callback(null, true)
      else if (
        typeof origin === 'undefined' ||
        [
          'https://localhost:8081',
          'https://server.vaithuhay.com',
          'https://accounts.google.com'
        ].indexOf(origin) !== -1
      ) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS.'))
      }
    }
  })
)
app.use(socketMiddleware(io))
//for debugging via query string
app.use((req, res, next) => {
  req.debug = req.query.debug === 'true'
  next()
})
//routes
app.use('/dist', express.static(path.join(global.APP_PATH, '../dist')))
app.use('/uploads', express.static(path.join(global.APP_PATH, '../uploads')))
app.use('/trans', translate)
app.use('/images', image)
app.use('/g', google)
app.use('/collections', collections)
app.use('/social', social)
app.use('/u', user)
app.use('/callback', HaravanHooks)
app.use('/fb-callback', FacebookHooks)
// app.use('/noti', pushNoti)
app.use('/products', products)
app.use('/ssr', ssr)
if (process.env.NODE_ENV === 'development') {
  app.get('/oauth2callback', (req, res) => {
    const qs = new url.URL(req.url, 'https://localhost:8089').searchParams
    res.end('Authentication successful! Please return to the console.')
    server.emit('test_code', qs.get('code'))
  })
}
app.use('/', index)

app.use(function(req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500).json({
    message: err.message,
    error: err
  })
})

// attach models to server
if (process.env.NODE_ENV === 'development') {
  server.app = app
  server.models = models
  server.utils = {
    HaravanClientApi,
    Settings
  }
  server.jobs = {
    updateProductJson,
    googleAnalyticsJob
  }
}
module.exports = server
