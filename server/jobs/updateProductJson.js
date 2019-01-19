import createQueue from '@server/jobs/classes/createQueue'
import HaravanClientApi from '@server/utils/HaravanClientAPI'
import yamlLoadAndParse from '@server/utils/yamlLoadAndParse'
import { expect } from 'chai'
import ServiceContainers from '@server/core/containers'
import { SOCKET_EV } from '@universal/consts'
import { chunkMetafieldJsonString } from '@server/utils/helpers'
import { cache } from '@server/utils'
import { bytesToSize } from '@universal/helpers'
import googleAnalyticsJob from '@server/jobs/GoogleAnalytics'
import middlewares from '@server/routes/middlewares'

/**
 * Ensure there is no 2 distinct job exists on real-time
 * @type {Map<any, any>}
 * @private
 */
const _queueIdentity = new Map()

const queue = createQueue(),
  log = (eventName, message = '') => {
    return ServiceContainers.call('io', io => {
      io.emit(eventName, message)
    })
  }

queue.process(
  'updateProduct',
  4,
  async ({ data: { id: productId, options } }, done) => {
    const beginEvName =
      options && options.total
        ? SOCKET_EV.Util.UpdateProductJsonPart
        : SOCKET_EV.Util.UpdateProductJson
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

    await log(beginEvName, `Begin update JSON HTML for "${handle}"`)

    const json = await yamlLoadAndParse(`/products/${handle}?view=yaml`)
    if (json === null) {
      await log(SOCKET_EV.Util.UpdateProductJsonProgress, `Skip this product`)
      await log(SOCKET_EV.Util.UpdateProductJsonCompleted)
      done()
      return
    }

    /**
     * BEGIN PROCESS
     */

    // RELATED PRODUCTS
    const metafields = await HaravanClientApi.getMetafields(
        'products',
        productId
      ),
      relatedHandles = []

    for (const key in metafields)
      if (metafields.hasOwnProperty(key) && /^[0-9]+$/.test(key))
        relatedHandles.push(metafields[key])
    json.relateds = (await Promise.all(
      relatedHandles.map(_handle =>
        yamlLoadAndParse(`/products/${_handle}?view=yaml`).then(p => {
          if (p !== null && typeof p === 'object') {
            delete p.current.content
            return p.current
          }
          return null
        })
      )
    )).filter(p => p !== null)
    await log(
      SOCKET_EV.Util.UpdateProductJsonProgress,
      `${json.relateds.length} related products...`
    )

    // FAQ
    if (metafields['vaithuhay-faq']) json.faq = metafields['vaithuhay-faq']

    /**
     * END PROCESS
     */
    const jsonParts = chunkMetafieldJsonString(JSON.stringify(json), 'json')

    await HaravanClientApi.setMetafieldForProduct(productId, jsonParts)
    await log(
      SOCKET_EV.Util.UpdateProductJsonProgress,
      `Update completed (size = ${bytesToSize(
        JSON.stringify(json).length
      )}, distributed in ${Object.keys(jsonParts).length} keys)`
    )
    await log(SOCKET_EV.Util.UpdateProductJsonCompleted)
    done()
  }
)

function updateProductJson(id, priority = 'normal', options = {}) {
  return new Promise((resolve, reject) => {
    if (_queueIdentity.has(id)) {
      resolve()
      return
    }
    queue
      .create('updateProduct', { id, options })
      .priority(priority)
      .attempts(3)
      .removeOnComplete(true)
      .on('complete', rs => {
        _queueIdentity.delete(id)
      })
      .save(err => {
        if (err) reject(err)
        else
          log(0).then(() => {
            _queueIdentity.set(id, true)
            resolve()
          })
      })
  })
}

/**
 * Register job with another GA events callback
 */
const gaInject = async data => {
  if (data.err) {
    console.error(err)
    return
  }

  if (!data.id) {
    // TODO: well process all products
    const obj = { products: [] }
    await middlewares.allProducts(obj)
    const willSync =
      process.env.NODE_ENV === 'development'
        ? obj.products.slice(0, 32)
        : obj.products
    await ServiceContainers.call('io', io => {
      io.emit(SOCKET_EV.Util.UpdateProductJsonAll, willSync.length)
    })
    willSync.forEach(product =>
      updateProductJson(product.id, 'normal', {
        total: willSync.length
      })
    )
  }

  //finally re-attach again
  googleAnalyticsJob.once('done', gaInject)
}
googleAnalyticsJob.once('done', gaInject)

export default updateProductJson
