import { apiGet, cache } from '@server/utils/index'
import pick from 'lodash/pick'
import uniq from 'lodash/uniq'

const emitTopProp = key => obj => obj[key]
// trying to convert str to JSON
const flex = obj => {
  let rs
  try {
    rs = JSON.parse(obj)
  } catch (e) {
    rs = obj
  }
  return rs
}
const pickFields = (_fields = null, type = 'product') => obj => {
  if (_fields === null) return obj
  let fields = _fields.split(',')
  const defaults = {
    product: ['id', 'title', 'handle', 'url', 'thumbnail', 'price']
  }
  fields.push(...defaults[type])
  return pick(obj, uniq(fields))
}
const compressMetafields = metafields =>
  (metafields.metafields || metafields)
    .map(({ key, value }) => ({
      [key]: flex(value)
    }))
    .reduce((acc, metafield) => Object.assign({}, acc, metafield), {})
const attachMetafields = (resource, id) => resourceObj =>
  apiGet(`/admin/${resource}/${id}/metafields.json?namespace=vaithuhay`)
    .then(compressMetafields)
    .then(metafields => ({
      ...resourceObj,
      metafields
    }))

function postProcessProduct(product) {
  // combine multi lang title
  if (product.title && product.metafields.title) {
    product.title = {
      vi: product.title,
      en: product.metafields.title
    }
    delete product.metafields.title
  } else {
    product.title = {
      vi: product.title,
      en: ''
    }
  }

  // assign url to product
  product.url = '/products/' + product.handle

  // omit unneeded fields in images
  if (product.images) {
    // set feature image (which position = 1)
    product.thumbnail = product.images.filter(
      img => img.position * 1 === 1
    )[0].src

    product.images = product.images.map(img =>
      pick(img, ['src', 'variant_ids'])
    )
  }

  // pick variant with position=1
  let variant = product.variants.filter(
    variant => variant.position * 1 === 1
  )[0]
  product.price = {
    current: variant.price
  }
  if (variant.compare_at_price > 0) product.price.old = variant.compare_at_price
  return product
}
function _getProductById(id) {
  return apiGet(`/admin/products/${id}.json`)
    .then(emitTopProp('product'))
    .then(attachMetafields('products', id))
}
function _getProductByHandle(handle) {
  const id = cache.get('product:' + handle)
  return _getProductById(id)
}
function getProduct(handle) {
  let id = parseInt(handle),
    promise = undefined
  if (isNaN(id)) promise = _getProductByHandle(handle)
  else promise = _getProductById(id)
  return promise.then(postProcessProduct)
}

function postProcessCollection(_collection) {
  const collection = pick(_collection, [
    'id',
    'handle',
    'title',
    'image',
    'products'
  ])
  collection.url = '/collections/' + collection.handle
  return collection
}
async function _getCollectionById(id, type) {
  let collection = await apiGet(`/admin/${type}_collections/${id}.json`)
  collection = emitTopProp(`${type}_collection`)(collection)

  // pick all collects, map them to products
  const { collects } = await apiGet(`/admin/collects.json?collection_id=${id}`)
  // then attach to collection
  collection.products = await Promise.all(
    collects.map(collect =>
      getProduct(collect.product_id).then(pickFields('', 'product'))
    )
  )
  return collection
}
function _getCollectionByHandle(handle) {
  let type = 'custom',
    id = cache.get('collection:custom:' + handle)
  if (!id) {
    id = cache.get('collection:smart:' + handle)
    type = 'smart'
  }
  return _getCollectionById(id, type)
}
function getCollection(handle) {
  return _getCollectionByHandle(handle).then(postProcessCollection)
}

const HaravanClientApi = {
  getProduct,
  getCollection
}
export default HaravanClientApi
export { pickFields }
