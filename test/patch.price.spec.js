import { server, socket } from './setup'
import chai from 'chai'
import { SOCKET_EV } from '../universal/consts'

const expect = chai.expect

describe('Patch products price job', function() {
  this.timeout(20000)
  this.slow(5000)

  it('must success', function(done) {
    socket.on(SOCKET_EV.Util.PatchPriceCompleted, res => {
      expect(res.status).to.equal('ok')
      console.log(res.data)
      done()
    })
    socket.emit(SOCKET_EV.Util.OnPatchPrice)
  })
})
