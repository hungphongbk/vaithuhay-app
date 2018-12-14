import { apiGet, cache } from '@server/utils/index'
import flatten from 'lodash/flatten'
import {
  getCollections,
  updateTopProductsCollection
} from '@server/routes/collections'
import HaravanClientApi from '@server/utils/HaravanClientAPI'

export default () =>
  new Promise(async resolve => {
    // fetch product list & collection list
    const [products$1, products$2, collections] = await Promise.all([
        apiGet(`/admin/products.json`),
        apiGet(`/admin/products.json?page=2`),
        getCollections()
      ]),
      products = flatten(
        [products$1, products$2].map(({ products }) => products)
      )
    await Promise.all(
      products.map(async ({ id, handle, variants }) => {
        // await Promise.all(
        //   variants.map(variant =>
        //     HaravanClientApi.setMetafieldForProductVariant(id, variant.id, {
        //       originalPrice: variant.compare_at_price || variant.price
        //     })
        //   )
        // )
        // console.log('update metafield for variants in product ' + handle)
        await cache.setAsync('product:' + handle, id)
      })
    )
    await Promise.all(
      collections.map(({ id, collectionType, handle }) => {
        return Promise.all([
          cache.setAsync(`collection:${collectionType}:${handle}`, id),
          cache.setAsync(`collection:${id}`, collectionType)
        ])
      })
    )

    // fetch top products collection
    // await updateTopProductsCollection()
    console.log('fetch all products completed')
    resolve()
  })
