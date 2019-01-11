import { server } from './setup'

describe('Invalidate Haravan resource cache in Redis', function() {
  const ids = {
    products: [1011808373, 1018295624]
  }

  it('Invalidate product cache', async function() {
    await Promise.all(
      ids.products.map(
        id => server.utils.HaravanClientApi.cache.invalidateProduct(id)
        // Promise.resolve()
      )
    )
  })
})
