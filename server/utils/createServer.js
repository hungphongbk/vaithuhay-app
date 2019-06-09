import http from 'http'
import https from 'https'
import fs from 'fs'
import socketIO from 'socket.io'
import path from 'path'
// import requestStats from 'request-stats'

// import omit from 'lodash/omit'
import bootstrap from '@server/utils/bootstrap'
import ServiceContainers from '@server/core/containers'

const dev = process.env.NODE_ENV === 'development',
  port = global.APP_PORT

export default function(app, bootstrapCallbacks = []) {
  //firebase db ref to 'requestLogging/[dev/prod]'
  // const dbRef = FirebaseAdmin.database().ref('server')

  global.APP_INSTANCE = app
  app.set('port', port)
  console.log('SERVER port = ' + port)

  function createDev() {
    console.log('SERVER will be initialized on development mode')
    const key = fs.readFileSync(
        path.join(global.APP_PATH, '../.private/server.vaithuhay.com.key')
      ),
      cert = fs.readFileSync(
        path.join(global.APP_PATH, '../.private/server.vaithuhay.com.crt')
      ),
      credentials = { key, cert }
    return https.createServer(credentials, app)
  }

  function createProd() {
    return http.createServer(app)
  }

  const server = dev ? createDev() : createProd(),
    io = socketIO(server)

  bootstrap()
    .then(() => Promise.all(bootstrapCallbacks.map(f => f())))
    .then(() => {
      console.log('ready now')
      const httpServer = server.listen(port)

      // begin register io service
      ServiceContainers.set('io', io)

      server.on('vthAppClose', (cb = () => {}) => {
        console.log('Terminate vaithuhay.com server at next 500ms. Good bye :)')
        httpServer.close()
        setTimeout(() => {
          cb()
          process.exit(0)
        }, 500)
      })
      // setTimeout(() => {
      server.emit('vthAppReady')
      // }, 1000)
    })

  return { server, io }
}
