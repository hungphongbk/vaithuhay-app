import createQueue from '@server/jobs/classes/createQueue'
import { google } from 'googleapis'
import key from '@server/creds/gcloud/client_secret_764771183033-i9qmsuhhb4vsqh8gcd97o3f21fpm6034.apps.googleusercontent.com'
import middlewares from '@server/routes/middlewares'
import { SettingsWrapper } from '@server/components'
import ServiceContainers from '@server/core/containers'
import { SOCKET_EV } from '@universal/consts'
import EventEmitter from 'events'

const memoize = require('async-decorators').memoize,
  GA_EV = SOCKET_EV.GA

class Context {
  job: GoogleAnalyticsJob
  auth
  analytics
  viewId = 'ga:118256072'
  products
  findHandleFromId
  createAuth: Promise<Context>

  constructor(job) {
    this.job = job
    this.createAuth = memoize(this._createAuth.bind(this), {
      expireMs: 1000 * 3600
    })
  }

  async _createAuth(token) {
    const auth = this.job.authFn()
    this.auth = auth
    console.log('create ga auth')
    if (token)
      try {
        //copy only
        // await auth.getTokenInfo(token)
        auth.setCredentials(token)
        return this
      } catch (e) {
        console.error(e)
        throw e.toString()
      }
    else {
      throw 'Must logged in before'
    }
  }

  fetchAnalyticsApi() {
    this.analytics = google.analytics({
      version: 'v3',
      auth: this.auth
    })
    return this
  }

  async fetchProducts() {
    await middlewares.allProducts(this)
    return this
  }

  gaGet(params, callback) {
    return new Promise((resolve, reject) => {
      this.analytics.data.ga.get(
        Object.assign(
          {},
          {
            ids: this.viewId
          },
          params
        ),
        (...args) =>
          callback
            .apply(null, args)
            .then(resolve)
            .catch(reject)
      )
    })
  }
}

const _GoogleAnalyticsJob = {
  initJob: Symbol('initJob'),
  processUpdateTop: Symbol('processUpdateTop'),
  processUpdateRelated: Symbol('processUpdateRelated')
}
class GoogleAnalyticsJob extends EventEmitter {
  queue
  authFn
  constructor() {
    super()
    this.queue = createQueue()
    this.authFn = this.setupAuth(
      key.web.client_id,
      key.web.client_secret,
      (process.env.NODE_ENV === 'production'
        ? 'https://server.vaithuhay.com/b/'
        : 'https://localhost:8089/') + 'g/login/callback'
    )

    this.queue.process(
      'updateTop',
      this[_GoogleAnalyticsJob.processUpdateTop].bind(this)
    )
    this.queue.process(
      'updateRelated',
      4,
      this[_GoogleAnalyticsJob.processUpdateRelated].bind(this)
    )
  }

  setupAuth(clientId, clientSecret, redirectUri) {
    this.authFn = () =>
      new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  }

  async _log(eventName, message) {
    await ServiceContainers.call('io', io => {
      io.emit(eventName, message)
    })
    return this
  }

  jobDone(callback, err = null) {
    this.emit('done', err)
    callback(err)
  }

  [_GoogleAnalyticsJob.initJob]({ token }): Promise<Context> {
    const context = new Context(this)
    return context
      .createAuth(token)
      .then(ctx => ctx.fetchAnalyticsApi())
      .then(ctx => ctx.fetchProducts())
  }

  async [_GoogleAnalyticsJob.processUpdateTop](
    {
      data: { token, range = 10 }
    },
    done
  ) {
    const context = await this[_GoogleAnalyticsJob.initJob]({ token })
    await this._log(
      GA_EV.UpdateTopProductsProgress,
      'Successfully authenticated with Google APIs. Fetch GA data...'
    )

    const yesterday = (d => new Date(d.setDate(d.getDate() - 1)))(new Date()),
      beforeDays = (d => new Date(d.setDate(d.getDate() - range)))(new Date()),
      fm = d => d.toISOString().slice(0, 10)
    console.log('successfully set credentials')
    await context.gaGet(
      {
        'start-date': fm(beforeDays),
        'end-date': fm(yesterday),
        // metrics: 'ga:bounces,ga:entrances,ga:pageviews,ga:uniquePageviews,ga:timeOnPage,ga:exits',
        metrics: 'ga:pageviews',
        dimensions: 'ga:pagePath',
        sort: '-ga:pageviews',
        filters: 'ga:pagePath=~^/products/*',
        'max-results': 20
      },
      async (err, body) => {
        const products = context.products,
          { rows } = body.data,
          rs = rows
            .map(([path]) => {
              const m = /^\/products\/(.*)/.exec(path)
              if (m === null) return null
              const product = products.find(p => p.handle === m[1])
              if (typeof product === 'undefined' || product === null)
                return null
              else return [product.id, product.handle]
            })
            .filter(r => r !== null)

        console.log('set ga top')
        await SettingsWrapper.set('ga', 'top', rs)
        await this._log(GA_EV.UpdateTopProductsProgress, 'Update completed!')
        await this._log(GA_EV.UpdateTopProductsCompleted)
      }
    )
    this.jobDone(done)
  }

  async [_GoogleAnalyticsJob.processUpdateRelated]({ data }, done) {}

  updateTopProducts(token) {
    return new Promise((resolve, reject) => {
      this.queue
        .create('updateTop', { token })
        .priority('normal')
        .attempts(3)
        .removeOnComplete(true)
        .save(err => {
          if (err) reject(err)
          else {
            this._log(GA_EV.UpdateTopProducts)
              .then(() =>
                this._log(
                  GA_EV.UpdateTopProductsProgress,
                  'Task has been enqueued. Waiting...'
                )
              )
              .then(resolve)
          }
        })
    })
  }

  updateRelatedProducts() {}
}

const googleAnalyticsJob = new GoogleAnalyticsJob()
export default googleAnalyticsJob
