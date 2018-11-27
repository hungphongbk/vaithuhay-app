import { HaravanAPI, apiGet, apiPost, apiClear, cache } from '../utils/index'
import { Router } from 'express'
import Setting from '../models/Settings'
import sort from 'lodash/sortBy'
import maxBy from 'lodash/maxBy'
import pickBy from 'lodash/filter'
import reverse from 'lodash/reverse'
import { getFeaturedProducts } from '@server/routes/google'

const router = Router()
function search(metafields, meta) {
  return metafields.find(m => m.key === meta)
}
const getCollections = async () => {
  const [
      { custom_collections } = { custom_collections: [] },
      { smart_collections } = { smart_collections: [] }
    ] = await Promise.all([
      apiGet('/admin/custom_collections.json'),
      apiGet('/admin/smart_collections.json')
    ]),
    f = (type, i) => {
      i.collectionType = type
      return i
    },
    rs = []
  rs.push(...custom_collections.map(f.bind(null, 'custom')))
  rs.push(...smart_collections.map(f.bind(null, 'smart')))
  return rs
}
const getNewProductsCollection = async () => {
  const searched = await Setting.find({
    namespace: 'collections',
    key: 'newProducts'
  })
  if (searched.length === 0) {
    const collection = (await getCollections()).find(
      c => c.handle === 'san-pham-moi'
    )
    await new Setting({
      namespace: 'collections',
      key: 'newProducts',
      value: collection.id
    }).save()
    return collection.id
  } else return searched[0].value
}
const getPromoProductsCollection = async () => {
  const searched = await Setting.find({
    namespace: 'collections',
    key: 'promoProducts'
  })
  if (searched.length === 0) {
    const collection = (await getCollections()).find(c => c.handle === 'onsale')

    await new Setting({
      namespace: 'collections',
      key: 'promoProducts',
      value: collection.id
    }).save()
    return collection.id
  } else return searched[0].value
}
const updateTopProductsCollection = async () => {
  // find top product list
  const collection_id = cache.get('collection:custom:san-pham-hang-dau')
  const metafields = await getFeaturedProducts('vaithuhayTopProducts')
  const { collects: exists } = await apiGet(
    `/admin/collects.json?collection_id=${collection_id}`
  )

  // remove old products (by collect)
  await Promise.all(
    exists.map(({ id }) => HaravanAPI.del(`/admin/collects/${id}.json`))
  )

  // and push new
  await Promise.all(
    metafields.map(([product_id]) =>
      apiPost(`/admin/collects.json`, {
        collect: {
          product_id,
          collection_id
        }
      })
    )
  )

  // reset cache
  await apiGet(`/admin/collects.json?collection_id=${collection_id}`, false)

  console.log('update top products completed')
}

router.get('/', async (req, res) => {
  res.json(await getCollections())
})
router.post('/new', async (req, res) => {
  // Get ID of san-pham-moi collection
  // Sort every products by created_at
  const [collection_id, { products }] = await Promise.all([
    getNewProductsCollection(),
    apiGet('/admin/products.json?limit=250')
  ])
  console.log(collection_id)

  // get exists collects & products of san-pham-moi collection
  const { collects: exists } = await apiGet(
    `/admin/collects.json?collection_id=${collection_id}`
  )
  products.forEach(p => {
    p.created = Date.parse(p.created_at)
  })
  products.sort((p1, p2) => {
    if (p1.created < p2.created) return 1
    if (p1.created > p2.created) return -1
    return 0
  })

  // then create post request to update san-pham-moi collection
  // along with it, delete old collects by add a property to remains
  await Promise.all(
    exists.map(({ id }) => HaravanAPI.del(`/admin/collects/${id}.json`))
  )
  await Promise.all(
    products.slice(0, 20).map(({ id: product_id }) =>
      HaravanAPI.post(`/admin/collects.json`).json({
        collect: { product_id, collection_id }
      })
    )
  )
  res.json(products.map(p => p.title))
})

router.post('/promo', async (req, res) => {
  // Get ID of san-pham-moi collection
  // Sort every products by created_at
  const [collection_id, { products }] = await Promise.all([
    getPromoProductsCollection(),
    apiGet('/admin/products.json?limit=250')
  ])
  console.log(collection_id)

  // get exists collects & products of san-pham-moi collection
  const { collects: exists } = await apiGet(
    `/admin/collects.json?collection_id=${collection_id}`
  )
  products.forEach(p => {
    p.variants.forEach(v => {
      const comparedPrice = v.compare_at_price * 1.0
      v.sale = 0
      if (comparedPrice > 0) {
        v.sale = (comparedPrice - v.price) / comparedPrice
      }
    })
    const variant = maxBy(p.variants, ['sale'])
    p.sale = variant.sale
  })
  products.sort((p1, p2) => {
    if (p1.sale < p2.sale) return 1
    if (p1.sale > p2.sale) return -1
    return 0
  })
  const saleProducts = reverse(pickBy(products, p => p.sale > 0))

  // then create post request to update san-pham-moi collection
  // along with it, delete old collects by add a property to remains
  await Promise.all(
    exists.map(({ id }) => HaravanAPI.del(`/admin/collects/${id}.json`))
  )
  for (const product of saleProducts) {
    await HaravanAPI.post(`/admin/collects.json`).json({
      collect: {
        product_id: product.id,
        collection_id
      }
    })
  }
  res.json(
    saleProducts.map(p => ({
      title: p.title,
      sale: p.sale
    }))
  )
})

export default router
export { getCollections, updateTopProductsCollection }
