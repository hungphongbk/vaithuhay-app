import { server, socket } from './setup'
import key from '../server/creds/gcloud/secret-test-only'
import opn from 'opn'
import fs from 'fs'
import path from 'path'

const timeout = 3600000
function read(filename) {
  if (!fs.existsSync(path.join(__dirname, `tmp/${filename}`))) return null
  const { value, lastUpdated } = JSON.parse(
    fs.readFileSync(path.join(__dirname, `tmp/${filename}`), 'utf-8')
  )
  if (Date.now() - lastUpdated > timeout) return null
  return value
}
function write(filename, value) {
  fs.writeFileSync(
    path.join(__dirname, `tmp/${filename}`),
    JSON.stringify({
      value,
      lastUpdated: Date.now()
    }),
    'utf-8'
  )
}

describe('GA tasks', function() {
  this.timeout(0)
  let token,
    googleAnalyticsJob = server.jobs.googleAnalyticsJob,
    redirectUri = 'https://localhost:8089/oauth2callback'

  googleAnalyticsJob.setupAuth(
    key.web.client_id,
    key.web.client_secret,
    redirectUri
  )

  before(function(done) {
    const redirectUri = 'https://localhost:8089/oauth2callback',
      oAuth2Client = googleAnalyticsJob.authFn(),
      authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/plus.me',
          'https://www.googleapis.com/auth/analytics'
        ]
      })

    googleAnalyticsJob.setupAuth(
      key.web.client_id,
      key.web.client_secret,
      redirectUri
    )

    const cached = read('token.json')
    if (!cached) {
      server.on('test_code', async code => {
        const { tokens } = await oAuth2Client.getToken(code)
        token = tokens
        write('token.json', token)
        done()
      })

      opn(authorizeUrl, { wait: false }).then(cp => cp.unref())
    } else {
      token = cached
      done()
    }
  })

  it('top products', function(done) {
    googleAnalyticsJob.once('done', done)
    googleAnalyticsJob.updateTopProducts(token)
  })
})
