import ioClient from 'socket.io-client'
import { expect } from 'chai'
import path from 'path'
import fs from 'fs'
const server = require('../bin/www')

describe('Upload image using socket.io', function() {
  let img,
    sender,
    ioOptions = {
      forceNew: true
    }
  before(function(done) {
    this.timeout(10000)
    server.on('vthAppReady', function() {
      sender = ioClient('https://localhost:8089/', ioOptions)
      sender.on('error', err => done(err))
      sender.on('connect', done)
    })
  })
  after(function(done) {
    if (sender.connected) sender.disconnect()
    // receiver.disconnect()
    server.emit('vthAppClose', done)
  })

  /* test cases */
  it('Create upload tasks', function(done) {
    this.timeout(8000)
    fs.readFile(
      path.resolve(process.cwd(), 'test/resources/upload1.jpg'),
      (err, buf) => {
        if (err) {
          done(err)
          return
        }

        sender.on('uploadImageDone', image => {
          img = image
          done()
        })
        sender.send('uploadImage', { uuid: 0, filename: 'upload1.jpg', buf })
      }
    )
  })
  // it('Checking URI', done => {
  //   done()
  // })
  // it('Remove uploaded images', function(done) {})
})
