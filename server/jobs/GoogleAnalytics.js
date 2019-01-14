import createQueue from '@server/jobs/classes/createQueue'
import { google } from 'googleapis'
import key from '@server/creds/gcloud/client_secret_764771183033-i9qmsuhhb4vsqh8gcd97o3f21fpm6034.apps.googleusercontent.com'
import middlewares from '@server/routes/middlewares'

const memoize = require('async-decorators').memoize

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
    const auth = this.job.authFn
    this.auth = auth
    if (token)
      try {
        //copy only
        await auth.getTokenInfo(token)
        auth.setCredentials({
          access_token: token
        })
        return this
      } catch (e) {
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
    this.analytics.data.ga.get(
      Object.assign(
        {},
        {
          ids: this.viewId
        },
        params
      ),
      callback
    )
  }
}

const _GoogleAnalyticsJob = {
  initJob: Symbol('initJob'),
  processUpdateTop: Symbol('processUpdateTop'),
  processUpdateRelated: Symbol('processUpdateRelated')
}
class GoogleAnalyticsJob {
  Context
  queue
  authFn
  constructor() {
    this.queue = createQueue()
    this.authFn = () =>
      new google.auth.OAuth2(
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

  [_GoogleAnalyticsJob.initJob]({ token }): Promise<Context> {
    const context = new Context(this)
    return context
      .createAuth(token)
      .then(ctx => ctx.fetchAnalyticsApi())
      .then(ctx => ctx.fetchProducts())
  }

  async [_GoogleAnalyticsJob.processUpdateTop]({
    data: { token, range = 10 },
    done
  }) {
    const context = await this[_GoogleAnalyticsJob.initJob](token),
      yesterday = (d => new Date(d.setDate(d.getDate() - 1)))(new Date()),
      beforeDays = (d => new Date(d.setDate(d.getDate() - range)))(new Date()),
      fm = d => d.toISOString().slice(0, 10)

    context.gaGet(
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
      async (err, body) => {}
    )
  }

  async [_GoogleAnalyticsJob.processUpdateRelated]({ data, done }) {}

  updateTopProducts() {}

  updateRelatedProducts() {}
}

const googleAnalyticsJob = new GoogleAnalyticsJob()
export default googleAnalyticsJob
