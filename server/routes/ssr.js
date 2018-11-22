import { Router } from 'express'
import HaravanClientApi, { pickFields } from '@server/utils/HaravanClientAPI'
const ssr = new Router()
ssr.get('/product/:id', (req, res) => {
  HaravanClientApi.getProduct(req.params.id)
    .then(pickFields(req))
    .then(product => res.json(product))
})

export default ssr
