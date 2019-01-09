import chai from 'chai'
import path from 'path'
import fs from 'fs'
import chaiHttp from 'chai-http'
import chaiAsPromise from 'chai-as-promised'
import { server, socket } from './setup'

chai.use(chaiHttp)
chai.use(chaiAsPromise)

const expect = chai.expect
// import sinon from 'sinon'
//
// sinon.stub(console, 'log')

describe('Upload image using socket.io', function() {
  this.timeout(0)

  let img

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

  it('Image object must exists in Database', function(done) {
    server.models.Image.findById(img._id, (err, obj) => {
      if (err) {
        done(err)
        return
      }
      console.log(obj)
      expect(obj).to.be.an('object')
      done()
    })
  })

  describe('Checking generated thumbnail URLs', function() {
    it('all must formed valid images URL', function() {
      return Promise.all(
        Object.values(img.thumbnails).map(url =>
          chai
            .request(img.host)
            .get(url.replace(img.host, ''))
            .then(res => {
              expect(res).to.have.status(200)
              expect(res.type).to.equal('image/jpeg')
            })
        )
      )
    })
    it('all generated thumbs must exist & valid on drive', function() {
      return Promise.all(
        img.storage.map(
          uri =>
            new Promise(resolve => {
              fs.stat(uri, (err, stat) => {
                expect(err).to.be.null
                expect(stat.size).to.be.at.least(512, 'wtf image size < 512B?')
                resolve()
              })
            })
        )
      )
    })
  })

  // it('Checking URI', done => {
  //   done()
  // })
  // it('Remove uploaded images', function(done) {})
})
describe('Upload image 3D', function() {})
