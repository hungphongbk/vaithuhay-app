import createQueue from '@server/jobs/classes/createQueue'
import HaravanClientApi from '@server/utils/HaravanClientAPI'
import yamlLoadAndParse from '@server/utils/yamlLoadAndParse'
import { expect } from 'chai'
import ServiceContainers from '@server/core/containers'
import { SOCKET_EV } from '@universal/consts'
import { chunkMetafieldJsonString } from '@server/utils/helpers'
import { cache } from '@server/utils'

const queue = createQueue(),
  log = (status, message = '') => {
    const eventName = [
      SOCKET_EV.Util.UpdateProductJson,
      SOCKET_EV.Util.UpdateProductJsonProgress,
      SOCKET_EV.Util.UpdateProductJsonCompleted
    ][status]
    return ServiceContainers.call('io', io => {
      io.emit(eventName, message)
    })
  }

queue.process('updateProduct', 1, async ({ data: { id: productId } }, done) => {
  /**
   * 1. Invalidate product cache in Redis
   * 2. Get base JSON from vaithuhay (view=yaml)
   * 3. Update JSON with its needed metafields
   * 4. Save JSON to product metafield (key = `json`)
   */
  await HaravanClientApi.cache.invalidateProduct(productId)

  const handle = await cache.getAsync('product-id:' + productId)

  expect(handle, `key product-id:${productId} didn't exist in Redis!`).is.not
    .null

  await log(1, `Begin update JSON HTML for "${handle}"`)

  const json = await yamlLoadAndParse(`/products/${handle}?view=yaml`),
    jsonParts = chunkMetafieldJsonString(JSON.stringify(json), 'json')

  await HaravanClientApi.setMetafieldForProduct(productId, jsonParts)
  await log(
    1,
    `Update completed (length = ${
      JSON.stringify(json).length
    }, distributed in ${Object.keys(jsonParts).length} keys)`
  )
  await log(2)
  done()
})

function updateProductJson(id, priority = 'normal') {
  return new Promise((resolve, reject) => {
    queue
      .create('updateProduct', { id })
      .priority(priority)
      .attempts(3)
      .removeOnComplete(true)
      .save(err => {
        if (err) reject(err)
        else log(0).then(resolve)
      })
  })
}

export default updateProductJson
