import { apiGet, cache } from '@server/utils/index'
import flatten from 'lodash/flatten'
import {
  getCollections,
  updateTopProductsCollection
} from '@server/routes/collections'

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
      products.map(({ id, handle }) => {
        return cache.setAsync('product:' + handle, id)
      })
    )
    await Promise.all(
      collections.map(({ id, collectionType, handle }) => {
        return cache.setAsync(`collection:${collectionType}:${handle}`, id)
      })
    )

    // fetch top products collection
    // await updateTopProductsCollection()
    console.log('fetch all products completed')
    resolve()
  })
