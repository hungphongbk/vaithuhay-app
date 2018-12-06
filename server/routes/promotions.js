import { Router } from 'express'
import Promotions from '@server/models/Promotions'
import HaravanClientApi from '@server/utils/HaravanClientAPI'
import { apiDel } from '@server/utils'
// import middlewares from '@server/routes/middlewares'
// import { ProductFavorite } from '@server/models'

const router = new Router()

function getAllPromotions() {
  return Promotions.find({})
}

const bootstrap = async () => {
  /**
   * Execute: remove 'promotionProgram' metafield from product/collection
   * @param program
   * @returns {Promise<void>}
   */
  async function removeOldProgram(program) {
    const {
      promotionApplyToResource: resource,
      promotionApplyToId: id
    } = program
    const haravan_promotionProgram = (await HaravanClientApi.getMetafields(
      resource,
      id,
      true
    )).promotionProgram
    if (
      typeof haravan_promotionProgram === 'undefined' ||
      haravan_promotionProgram === null
    )
      return
    await apiDel(
      `/admin/${resource}/${id}/metafields/${haravan_promotionProgram.id}.json`
    )
  }

  const haravan_promotionProgram = (await HaravanClientApi.getMetafields(
    null,
    null,
    true
  )).promotionProgram
  if (
    typeof haravan_promotionProgram === 'undefined' ||
    haravan_promotionProgram === null
  )
    return

  console.log(haravan_promotionProgram)
  await Promise.all(haravan_promotionProgram.value.list.map(removeOldProgram))
}

router.get('/', async (req, res) => {
  const promotions = await getAllPromotions()
  res.json(promotions.toJSON())
})

router.post('/', async (req, res) => {})

export default router
export { bootstrap }
