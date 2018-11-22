import { Router } from 'express'
import HaravanClientApi, { pickFields } from '@server/utils/HaravanClientAPI'
const ssr = new Router()
ssr.get('/product/:id', (req, res) => {
  HaravanClientApi.getProduct(req.params.id)
    .then(pickFields(req.query.fields))
    .then(product => res.json(product))
})
ssr.get('/collection/:id', (req, res) => {
  HaravanClientApi.getCollection(req.params.id).then(collection =>
    res.json(collection)
  )
})

export default ssr
