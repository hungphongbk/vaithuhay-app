import { server, socket } from './setup'
import { SOCKET_EV } from '../universal/consts'

const ids = {
  products: [1011808373, 1018295624, 1011827837, 1007122439]
}

describe('Invalidate Haravan resource cache in Redis', function() {
  it('Invalidate product cache', async function() {
    await Promise.all(
      ids.products.map(
        id => server.utils.HaravanClientApi.cache.invalidateProduct(id)
        // Promise.resolve()
      )
    )
  })
})

describe('Update resource JSON body', function() {
  this.timeout(0)
  this.slow(20000)
  let logs = []
  beforeEach(function(done) {
    logs = []
    socket.on(SOCKET_EV.Util.UpdateProductJson, message => {
      console.log(message)
      logs.push({ status: 0, message })
    })
    socket.on(SOCKET_EV.Util.UpdateProductJsonProgress, message => {
      console.log(message)
      logs.push({ status: 0, message })
    })
    socket.on(SOCKET_EV.Util.UpdateProductJsonCompleted, message => {
      console.log(message)
      logs.push({ status: 2, message })
    })
    done()
  })
  it('Product # task', function(done) {
    let count = 0
    function doneTask() {
      if (++count === ids.products.length) done()
    }
    socket.on(SOCKET_EV.Util.UpdateProductJsonCompleted, () => doneTask())

    ids.products.map(id => server.jobs.updateProductJson(id))
  })
  // it('Product # log must be fulfilled', function() {})
})
