import { Router } from 'express'
import PushNotification from '@server/jobs/push-notification'
import { admin } from '@server/routes/middlewares'

const router = new Router()

//Register a token
router.get('/stat', admin, (req, res) => {
  PushNotification.stat().then(stat => res.json(stat))
})

//List all messages, SUPPORT PAGINATE
router.get('/list', admin, PushNotification.paginateMiddleware, (req, res) => {
  res.json({ status: 'ok', ...req.pushNoti })
})

//new subscriber
router.post('/register', (req, res) => {
  const { token, topics = [], refresh = false } = req.body
  PushNotification.registerNewToken(token, topics, req.debug || !refresh)
    .then(() => {
      res.json({ status: 'ok' })
    })
    .catch(err => {
      res.json({ status: 'err', message: err.message })
    })
})

//send broadcast message
router.post('/broadcast', admin, (req, res) => {
  const {
    title,
    body,
    click_action,
    icon,
    options = {},
    topic = req.debug
      ? PushNotification.topics.DEV
      : PushNotification.topics.ALL
  } = req.body
  PushNotification.sendNotification(
    'topic',
    topic,
    {
      title,
      body,
      ...(click_action ? { click_action } : {}),
      ...(icon ? { icon } : {}),
      options
    },
    !req.debug
  )
    .then(message => {
      res.json({ status: 'ok', message })
    })
    .catch(err => {
      res.json({ status: 'err', message: err.message })
    })
})

//store message to send later
router.post('/store', admin, (req, res) => {
  const payload = Object.assign(
      {},
      {
        // topics: PushNotification.topics.ALL,
        content_available: 'true',
        priority: 'high'
      },
      req.body
    ),
    { type = 'topic', identifier = PushNotification.topics.ALL } = req.query
  PushNotification.storeNotification(null, type, identifier, payload)
    .then(message => {
      res.json({ status: 'ok', message })
    })
    .catch(err => {
      res.json({ status: 'err', message: err.message })
    })
})

//[DEV ONLY] resend a message
router.patch('/resend', admin, (req, res) => {
  const { _id } = req.query
  PushNotification.resendNotification(_id, req.debug)
    .then(() => {
      res.json({ status: 'ok' })
    })
    .catch(err => {
      res.status(500).json({ status: 'err', message: err.message })
    })
})

//[DEV ONLY] delete a message
router.delete('/', admin, (req, res) => {
  PushNotification.deleteMessage(req.query._id)
    .then(() => res.json({ status: 'ok' }))
    .catch(e => res.status(500).json({ status: 'err', message: e.message }))
})

router.post('/test', (req, res) => {
  const { token } = req.body
  PushNotification.sendNotification('device', token, {
    title: 'Welcome to Vaithuhay.com',
    body: 'Ahihi bạn ngu vê lờ'
    // content_available: "true",
    // priority: "high"
  })
    .then(() => {
      res.json({ status: 'ok' })
    })
    .catch(err => {
      res.json({ status: 'err', message: err.message })
    })
})

export default router
