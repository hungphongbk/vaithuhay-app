import { apiGet, cache } from '@server/utils/index'
import pick from 'lodash/pick'

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
const pickFields = req => obj => {
  if (!req.query.fields) return obj
  const fields = req.query.fields.split(',')
  if (fields.indexOf('id') === -1) fields.push('id')
  return pick(obj, req.query.fields.split(','))
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
  }

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

const HaravanClientApi = {
  getProduct
}
export default HaravanClientApi
export { pickFields }
