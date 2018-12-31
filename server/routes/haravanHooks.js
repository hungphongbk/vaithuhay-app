import { Router } from 'express'
import { apiDel, apiGet, apiPost, apiPut } from '../utils'
import syncQueue from '../jobs/sync-spreadsheet-v2'
import range from 'lodash/range'
import flatten from 'lodash/flatten'
import moment from 'moment-timezone'
import qs from 'query-string'
import chunk from 'lodash/chunk'
import spreadsheet from '@server/components/Spreadsheet'
import { HaravanAPI } from '@server/core/haravan-api'

const router = new Router(),
  CARTS_CREATE_ADDRESS = 'https://server.vaithuhay.com/b/callback/createCart',
  ORDER_PROCESS_ADDRESS = 'https://server.vaithuhay.com/b/callback/processOrder'
const flex = obj => {
  let rs
  try {
    rs = JSON.parse(obj)
  } catch (e) {
    rs = obj
  }
  return rs
}
//check whether webhook already registered
async function createOrUpdate(topics, address) {
  const { webhooks: $all } = flex(await HaravanAPI.get('/admin/webhooks.json')),
    webhooks = $all.filter(h => h.address === address)
  if (!webhooks || webhooks.length === 0) {
    const create = topic =>
      HaravanAPI.post('/admin/webhooks.json').json({
        webhook: {
          topic,
          address,
          format: 'json'
        }
      })
    await Promise.all(topics.map(create))
  } else {
    const update = ({ id }) =>
      HaravanAPI.put(`/admin/webhooks/${id}.json`).json({
        webhook: {
          id,
          address
        }
      })
    await Promise.all(webhooks.map(update))
  }
}

if (process.env.NODE_ENV === 'development')
  (async function() {
    if (false) {
      const { webhooks: $all } = flex(
        await HaravanAPI.get('/admin/webhooks.json')
      )
      await Promise.all(
        $all.map(webhook =>
          HaravanAPI.del('/admin/webhooks/' + webhook.id + '.json')
        )
      )
    }
    await createOrUpdate(['carts/create', 'carts/update'], CARTS_CREATE_ADDRESS)
    await createOrUpdate(
      [
        'orders/create',
        'orders/cancelled',
        'orders/updated',
        'orders/delete',
        'orders/fulfilled',
        'orders/paid'
      ],
      ORDER_PROCESS_ADDRESS
    )
  })()

router.post('/createCart', (req, res) => {
  // console.log(req.body)
  res.json({})
})

const orderMiddleware = (req, res, next) => {
  try {
    req.order = Object.assign(
      {},
      {
        _id: req.headers['x-haravan-order-id'],
        status: req.headers['x-haravan-topic'],
        ...req.body
      }
    )
    // console.log(req.order);
    next()
  } catch (e) {
    console.log(e.message)
    res.status(500).send(e.message)
  }
}
if (process.env.NODE_ENV === 'production')
  router.post('/processOrder', orderMiddleware, (req, res) => {
    if (
      req.order.status === 'orders/cancelled' &&
      req.order.financial_status === 'pending'
    ) {
      req.order.financial_status = 'voided'
    }
    try {
      syncQueue
        .create('sync', req.order)
        .priority('normal')
        .attempts(3)
        .removeOnComplete(true)
        .save(err => {
          if (err) throw err
        })
      res.json({})
    } catch (e) {
      console.log(e.message)
      res.json({})
    }
  })

router.post('/manual', async (req, res) => {
  const params = {
      created_at_min: moment()
        .subtract(15, 'days')
        .format('YYYY-M-D HH:MM')
    },
    { count } = await apiGet(
      '/admin/orders/count.json?' + qs.stringify(params),
      false
    )

  const orders = flatten(
    await Promise.all(
      range(Math.ceil(count / 50)).map(i =>
        apiGet(
          '/admin/orders.json?' +
            qs.stringify({
              ...params,
              page: i + 1
            }),
          false
        ).then(({ orders }) => orders)
      )
    )
  )
  console.log(`process ${orders.length} orders`)
  await spreadsheet.write(orders.reverse())

  res.json({
    status: 'OK',
    logger: spreadsheet.emitLog()
  })
})

if (process.env.NODE_ENV === 'development') {
  const sortBy = require('lodash/sortBy'),
    OrderProcess = require('../models/OrderProcess').default,
    filterAsync = (array, filter) =>
      Promise.all(array.map(entry => filter(entry))).then(bits =>
        array.filter(entry => bits.shift())
      )

  router.post('/syncOrder', async (req, res) => {
    //get all orders from past week
    const { days = 3, before = 0, number = 0, reset = 0 } = req.query,
      params = {}

    // if(reset) await OrderProcess.dropAllIndexes()

    if (number === 0) {
      params.created_at_min = moment()
        .subtract(days, 'days')
        .format('YYYY-M-D HH:MM')
      if (before > 0)
        params.created_at_max = moment()
          .subtract(before, 'days')
          .format('YYYY-M-D HH:MM')
    } else {
      params.limit = number
    }

    //get exact numbers of orders & order list by _params + paginate
    const { count } = await await apiGet(
      '/admin/orders/count.json?' + qs.stringify(params),
      false
    )

    const $orders = flatten(
        await Promise.all(
          range(Math.ceil(count / 50)).map(i =>
            apiGet(
              '/admin/orders.json?' +
                qs.stringify({
                  ...params,
                  page: i + 1
                }),
              false
            ).then(({ orders }) => orders)
          )
        )
      ),
      orders = await filterAsync($orders, async order => {
        return !(await OrderProcess.findOne({ number: order.order_number }))
      })

    try {
      const pushToQueue = orders =>
        syncQueue
          .create('checkOrder', { orders, io: null })
          .priority('high')
          .attempts(3)
          .removeOnComplete(true)
          .save(err => {
            if (err) console.log(err.message)
          })
      chunk(orders, 10).map(pushToQueue)
      res.json({
        count: orders.length,
        orders: sortBy(orders, ['order_number']).map(o => o.order_number)
      })
    } catch (e) {
      console.log(e.message)
      res.json({})
    }
  })
}

export default router
