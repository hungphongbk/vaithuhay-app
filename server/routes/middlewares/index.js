import { apiGet } from '../../utils'
import flatten from 'lodash/flatten'
import { ProductFavorite } from '@server/models'

export default {
  async allProducts(req, res, next) {
    const queryProductFavorite = async product => {
      product.favorites = await ProductFavorite.find({
        productId: product.id
      })
      return product
    }

    const fields = [
      'id',
      'images',
      'options',
      'product_type',
      'tags',
      'title',
      'variants',
      'handle'
    ].join(',')
    const all = await Promise.all([
        apiGet(`/admin/products.json?fields=${fields}`),
        apiGet(`/admin/products.json?fields=${fields}&page=2`)
      ]),
      products = flatten(all.map(({ products }) => products))
    await Promise.all(products.map(queryProductFavorite))
    req.products = products
    req.findHandleFromId = id => products.find(p => p.id * 1 === id * 1).handle
    next()
  }
}

export const socketMiddleware = io => (req, res, next) => {
  req.io = io
  next()
}

export const admin = (req, res, next) => {
  //admin must have 'x-user-token' in request header
  if (!req.header('x-user-token'))
    res.status(403).send({ error: 'Invalid request' })
  else next()
}
