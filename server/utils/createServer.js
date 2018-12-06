import http from 'http'
import https from 'https'
import fs from 'fs'
import socketIO from 'socket.io'
import requestStats from 'request-stats'
import { FirebaseAdmin } from '@server/components'
import omit from 'lodash/omit'
import bootstrap from '@server/utils/bootstrap'

const dev = process.env.NODE_ENV === 'development',
  port = global.APP_PORT

export default function(app, bootstrapCallbacks = []) {
  //firebase db ref to 'requestLogging/[dev/prod]'
  const dbRef = FirebaseAdmin.database().ref('server')

  global.APP_INSTANCE = app
  app.set('port', port)
  console.log('SERVER port = ' + port)

  function createDev() {
    console.log('SERVER will be initialized on development mode')
    const key = fs.readFileSync('/Users/myowngrave/server.key'),
      cert = fs.readFileSync('/Users/myowngrave/server.crt'),
      credentials = { key, cert }
    return https.createServer(credentials, app)
  }

  function createProd() {
    return http.createServer(app)
  }

  const server = dev ? createDev() : createProd(),
    io = socketIO(server)

  requestStats(server, requestInfo => {
    const env = dev ? 'dev' : 'prod'
    if (requestInfo.req.method.toLowerCase() === 'options')
      return Promise.resolve()

    const obj = omit(requestInfo, ['req.raw', 'res.raw'])
    obj.timestamp = Date.now()

    return dbRef
      .child(`requestLogging/${env}`)
      .push()
      .set(obj, err => {
        if (err) console.error(err)
      })
  })

  bootstrap()
    .then(() => Promise.all(bootstrapCallbacks.map(f => f())))
    .then(() => {
      console.log('ready now')
      server.listen(port)
    })

  return { server, io }
}
