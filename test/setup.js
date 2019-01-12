import io from 'socket.io-client'
import fs from 'fs'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const server = require('../bin/www')
let socket,
  ioOptions = {
    forceNew: true,
    key: fs.readFileSync('/Users/myowngrave/server.key'),
    cert: fs.readFileSync('/Users/myowngrave/server.crt'),
    rejectUnauthorized: false
  }
before(function(done) {
  this.timeout(0)
  server.on('vthAppReady', function() {
    socket = io('https://localhost:8089', ioOptions)
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
