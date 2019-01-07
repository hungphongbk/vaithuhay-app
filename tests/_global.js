const server = require('../bin/www')
before(done => {
  server.on('vthAppReady', done)
})
after(done => {
  server.emit('vthAppClose', done)
})
