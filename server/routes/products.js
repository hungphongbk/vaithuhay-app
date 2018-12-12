import { Router } from 'express'
import middlewares from '@server/routes/middlewares'
import { ProductFavorite } from '@server/models'

const router = new Router()

const userFavoriteMiddleware = async (req, res, next) => {
  if (!(req.body.userId || req.query.userId)) {
    res.status(403).json({ message: 'login required' })
    return
  }
  const query = { userId: req.body.userId || req.query.userId }
  if (req.params.id) query.productId = req.params.id
  req.favorites = await ProductFavorite.find(query)
  next()
}

router.get('/', middlewares.allProducts, async (req, res) => {
  const data = req.products,
    id = req.query.id

  if (!id) res.json({ products: data })
  else res.json(data.find(p => p.id * 1 === id * 1))
})

// Get user favorites list
router.get('/favorites', userFavoriteMiddleware, async (req, res) => {
  try {
    const favorites = await Promise.all(
      req.favorites.map(
        f =>
          new Promise(resolve => {
            f.toJSONAsync(resolve)
          })
      )
    )
    res.json(favorites)
  } catch (e) {
    console.log(e)
  }
})

// Query & Make a favorite-add-or-remove action
router.get('/:id/favorite', userFavoriteMiddleware, (req, res) => {
  res.json({ value: req.favorites.length > 0 })
})
router.post('/:id/favorite', userFavoriteMiddleware, async (req, res) => {
  try {
    if (req.favorites.length === 0) {
      //create new

      await new ProductFavorite({
        productId: req.params.id,
        userId: req.body.userId
      }).save()
      res.json({ status: 'ok', behavior: 'add' })
    } else {
      // await req.favorites[0].remove();
      await Promise.all(req.favorites.map(model => model.remove()))
      res.json({ status: 'ok', behavior: 'remove' })
    }
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message })
  }
})

router.get('/:id/patch-variants', middlewares.allProducts, async (req, res) => {
  const product = req.products.find(p => p.id * 1 === req.params.id * 1)
  res.json(
    product.variants.map(v => ({
      id: v.id,
      compare_at_price: v.compare_at_price || v.price
    }))
  )
})

export default router
