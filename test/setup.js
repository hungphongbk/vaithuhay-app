import io from 'socket.io-client'
import fs from 'fs'

const isDev = process.env.NODE_ENV === 'development'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
global.APP_PATH = __dirname
process.on('uncaughtException', err => {
  console.log(`Error: ${err.message}`)
})

const server = require('../bin/www')
let socket,
  ioOptions = isDev
    ? {
        forceNew: true,
        key: fs.readFileSync('/Users/phong.truong/server.key'),
        cert: fs.readFileSync('/Users/phong.truong/server.crt'),
        rejectUnauthorized: false
      }
    : {}
before(function(done) {
  this.timeout(0)
  server.on('vthAppReady', function() {
    socket = io(
      isDev ? 'https://localhost:8089' : 'http://localhost:8090',
      ioOptions
    )
    socket.on('error', done)
    socket.on('connect', done)
  })
})
after(function(done) {
  this.timeout(0)
  if (socket.connected) socket.disconnect()
  // receiver.disconnect()
  server.emit('vthAppClose', done)
})

export { server, socket }
