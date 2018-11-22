import { apiGet, cache } from '@server/utils/index'
import flatten from 'lodash/flatten'

export default () =>
  new Promise(async resolve => {
    const [products$1, products$2] = await Promise.all([
        apiGet(`/admin/products.json`),
        apiGet(`/admin/products.json?page=2`)
      ]),
      products = flatten(
        [products$1, products$2].map(({ products }) => products)
      )
    products.forEach(({ id, handle }) => {
      cache.set('product:' + handle, id)
    })
    console.log('fetch all products completed')
    resolve()
  })
