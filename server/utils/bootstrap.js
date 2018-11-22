import { apiGet, cache } from '@server/utils/index'
import flatten from 'lodash/flatten'
import { getCollections } from '@server/routes/collections'

export default () =>
  new Promise(async resolve => {
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
    console.log('fetch all products completed')
    resolve()
  })
