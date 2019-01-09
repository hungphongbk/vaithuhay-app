import { server, socket } from './setup'
import chai from 'chai'
import { SOCKET_EV } from '../universal/consts'

chai.use(require('chai-string'))
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

describe.skip('Sync spreadsheet job', function() {
  this.timeout(1000 * 300) // must not longer than 5 minutes
  this.slow(1000 * 20)

  const logs = []

  before(function(done) {
    socket.on(SOCKET_EV.Util.SyncSheetProgress, log => logs.push(log))
    socket.on(SOCKET_EV.Util.SyncSheetCompleted, done)
    socket.emit(SOCKET_EV.Util.OnSyncSheet)
  })

  it('Check log last line', function() {
    logs.forEach(log => console.log(log))
    expect(logs.pop()).to.endsWith('Successfully!')
  })
})
