import {
  apiClear,
  apiDel,
  apiGet,
  apiPost,
  apiPut,
  cache
} from '@server/utils/index'
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
    product: [
      'id',
      'title',
      'description',
      'handle',
      'url',
      'thumbnail',
      'price'
    ]
  }
  fields.push(...defaults[type])
  return pick(obj, uniq(fields))
}
const compressMetafields = (metafields, withId = false) => {
  if (!(metafields.metafields || metafields).map) return {}
  return (metafields.metafields || metafields)
    .map(({ id, key, value }) => ({
      [key]: withId
        ? {
            id,
            value: flex(value)
          }
        : flex(value)
    }))
    .reduce((acc, metafield) => Object.assign({}, acc, metafield), {})
}

function buildMetafieldUrl(...args) {
  const toSingular = resource => resource.slice(0, -1)

  const [resource1, id1, resource2, id2, metafieldId] = args
  let url = '/admin'
  if (resource1 && !resource2) {
    url += `/${resource1}/${id1}`
  }
  url += `/metafields${
    metafieldId ? '/' + metafieldId : ''
  }.json?namespace=vaithuhay`
  if (typeof resource1 === 'undefined' || resource1 === null) {
    url += '&owner_resource=shop'
  }
  if (resource2)
    url += `&metafield[owner_id]=${id2}&metafield[owner_resource]=${toSingular(
      resource1
    ) +
      '_' +
      toSingular(resource2)}`
  return url
}
function getMetafields(
  resource = null,
  id = null,
  withId = false,
  resource2 = null,
  id2 = null
) {
  let url = buildMetafieldUrl(resource, id, resource2, id2)
  console.log(url)
  return apiGet(url).then(metafields => compressMetafields(metafields, withId))
}
const setMetafield = (
  resource = null,
  id = null,
  resource2 = null,
  id2 = null
) => async (metafields = {}) => {
  // console.log('set metafield ' + resource + ': ' + id)
  let url = buildMetafieldUrl(resource, id, resource2, id2)

  const _metafields = getMetafields(resource, id, true, resource2, id2)
  const buildMetafieldForm = form =>
    Object.assign(
      {},
      form,
      resource2 && false
        ? {
            owner_id: id2,
            owner_resource: 'product_variant'
          }
        : {}
    )

  for (const [key, _value] of Object.entries(metafields)) {
    const value = typeof _value === 'string' ? _value : JSON.stringify(_value)
    if (typeof _metafields[key] === 'undefined' || !_metafields[key]) {
      //POST request
      await apiPost(url, {
        metafield: buildMetafieldForm({
          namespace: 'vaithuhay',
          key,
          value_type: 'string',
          value
        })
      })
    } else {
      // PUT request
      const { id: metafieldId, value } = _metafields[key],
        subUrl = url.replace('.json', `/${metafieldId}.json`)
      await apiPut(subUrl, {
        metafield: buildMetafieldForm({
          value
        })
      })
      await apiClear(subUrl)
      await apiGet(subUrl, false)
    }
  }
  // clear caches
  await apiClear(url)
  await apiGet(url, false)
}
const setMetafieldForProduct = (id, metafields) =>
  setMetafield('products', id).call(null, metafields)
const setMetafieldForProductVariant = (productId, variantId, metafields) =>
  setMetafield('products', productId, 'variants', variantId).call(
    null,
    metafields
  )
const deleteMetafield = (resource, id) => {
  // TODO: fix parameter order
  let listUrl = buildMetafieldUrl(resource),
    url = buildMetafieldUrl(resource, id)
  console.log(listUrl)
  console.log(url)
  return apiDel(url).then(() => {
    return Promise.all([apiClear(listUrl), apiClear(url)]).then(() =>
      apiGet(listUrl, false)
    )
  })
}
const attachMetafields = (resource, id) => resourceObj =>
  getMetafields(resource, id).then(metafields => ({
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

  // assign description from body, by extract first 20 words
  product.description = product.metafields.desc
    ? product.metafields.desc.desc
    : { en: '', vi: '' }

  // assign url to product
  product.url = '/products/' + product.handle

  // omit unneeded fields in images
  if (
    product.images &&
    Array.isArray(product.images) &&
    product.images.length > 0
  ) {
    // set feature image (which position = 1)
    let thumbnail = product.images.filter(img => img.position * 1 === 1)[0]
    if (!thumbnail) thumbnail = product.images[0]
    product.thumbnail = thumbnail.src

    // console.log(product.images)
    // product.images = product.images.map(img =>
    //   pick(img, ['src', 'variant_ids'])
    // )
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
async function _getProductByHandle(handle) {
  const id = await cache.getAsync('product:' + handle)
  return await _getProductById(id)
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
  collection.products = (await Promise.all(
    collects.map(collect =>
      getProduct(collect.product_id).then(
        pickFields('published_at,published_scope', 'product')
      )
    )
  )).filter(
    product => {
      const cond =
        typeof product !== 'undefined' &&
        product !== null &&
        typeof product.published_at !== 'undefined' &&
        product.published_at !== null
      if (!cond) return false
      return (
        ['global', 'web'].findIndex(s => s === product.published_scope) >= 0
      )
    }
    // () => true
  )
  // console.log(Object.keys(collection.products[0]))
  return collection
}
async function _getCollectionByHandle(handle) {
  let type = 'custom',
    id = await cache.getAsync('collection:custom:' + handle)
  if (!id) {
    id = await cache.getAsync('collection:smart:' + handle)
    type = 'smart'
  }
  return await _getCollectionById(id, type)
}
async function getCollection(handle) {
  if (handle.match(/^[0-9]+$/)) {
    const type = await cache.getAsync('collection:' + handle)
    return _getCollectionById(handle, type).then(postProcessCollection)
  }
  return _getCollectionByHandle(handle).then(postProcessCollection)
}

async function invalidateMetafieldCache(productId) {}
function invalidateProductCache(productId) {
  return apiClear(`/admin/products/${productId}`, true)
}
function invalidateCollectionCache() {
  return apiClear('/admin/collects.json', true)
}

const HaravanClientApi = {
  getMetafields,
  setMetafield,
  setMetafieldForProduct,
  setMetafieldForProductVariant,
  deleteMetafield,
  getProduct,
  getCollection,
  cache: {
    invalidateProduct: invalidateProductCache,
    invalidateCollection: invalidateCollectionCache
  }
}
export default HaravanClientApi
export { pickFields }
