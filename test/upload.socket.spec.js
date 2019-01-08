import io from 'socket.io-client'
import { expect } from 'chai'
import path from 'path'
import fs from 'fs'
// import sinon from 'sinon'
//
// sinon.stub(console, 'log')

describe('Upload image using socket.io', function() {
  this.timeout(0)

  const server = require('../bin/www')
  let img,
    socket,
    ioOptions = {
      forceNew: true,
      key: fs.readFileSync('/Users/myowngrave/server.key'),
      cert: fs.readFileSync('/Users/myowngrave/server.crt'),
      rejectUnauthorized: false
    }
  before(function(done) {
    server.on('vthAppReady', function() {
      socket = io('https://localhost:8089', ioOptions)
      socket.on('error', done)
      socket.on('connect', done)
    })
  })
  after(function(done) {
    if (socket.connected) socket.disconnect()
    // receiver.disconnect()
    server.emit('vthAppClose', done)
  })

  it('MongoDB models have been exported inside server instance', () => {
    expect(server).to.have.property('models')
    expect(server.models).to.have.property('Image3D')
  })

  /* test cases */
  it('Create upload tasks, must return an image object', function(done) {
    this.slow(20000)
    fs.readFile(
      path.resolve(process.cwd(), 'test/resources/upload1.jpg'),
      (err, buf) => {
        if (err) {
          done(err)
          return
        }

        socket.on('uploadImageDone', image => {
          img = image
          done()
        })
        socket.emit('uploadImage', { uuid: 0, filename: 'upload1.jpg', buf })
      }
    )
  })

  it('Image object must have _id property', function() {
    expect(img).to.have.property('_id')
    // done()
  })

  // it('Checking URI', done => {
  //   done()
  // })
  // it('Remove uploaded images', function(done) {})
})
