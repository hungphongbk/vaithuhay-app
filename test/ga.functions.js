import { server } from './setup'
import url from 'url'
import { google } from 'googleapis'
import key from '../server/creds/gcloud/secret-test-only'
import opn from 'opn'

describe('GA tasks', function() {
  this.timeout(0)
  let token,
    googleAnalyticsJob = server.jobs.googleAnalyticsJob
  before(function(done) {
    const redirectUri = 'https://localhost:8089/oauth2callback',
      oAuth2Client = new google.auth.OAuth2(
        key.web.client_id,
        key.web.client_secret,
        redirectUri
      ),
      authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/plus.me',
          'https://www.googleapis.com/auth/analytics'
        ]
      })

    server.on('test_code', async code => {
      const { tokens } = await oAuth2Client.getToken(code)
      token = tokens
      done()
    })

    opn(authorizeUrl, { wait: false }).then(cp => cp.unref())
  })

  it('top products', async function() {})
})
