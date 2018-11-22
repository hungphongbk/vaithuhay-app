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
    products.forEach(({ id, handle }) => {
      cache.set('product:' + handle, id)
    })
    collections.forEach(({ id, collectionType, handle }) => {
      cache.set(`collection:${collectionType}:${handle}`, id)
    })

    // fetch top products collection
    await updateTopProductsCollection()
    console.log('fetch all products completed')
    resolve()
  })
