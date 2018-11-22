import { Router } from 'express'

const router = new Router()

router.get('/ads', (req, res) => {
  if (req.query['hub.verify_token'] === 'vaithuhay0803') {
    res.status(200).send(req.query['hub.challenge'])
    return
  }
  res.status(404).send({})
})

router.post('/ads', (req, res) => {
  console.log(req.body)
  res.json({})
})

export default router
