import { Router } from 'express'
import { apiDel, apiGet, apiPost, apiPut } from '../utils'
import syncQueue from '../jobs/sync-spreadsheet-v2'
import range from 'lodash/range'
import flatten from 'lodash/flatten'
import moment from 'moment-timezone'
import qs from 'query-string'
import fs from 'fs'
import chunk from 'lodash/chunk'
import spreadsheet from '@server/components/Spreadsheet'
import { HaravanAPI } from '@server/core/haravan-api'
import { startMeasureTime } from '@universal/helpers'
import Mustache from 'mustache'

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
  const { headers } = req
  if (!(headers['x-haravan-order-id'] && headers['x-haravan-topic'])) {
    res.status(403).send('fuck you :)')
    return
  }
  try {
    req.order = Object.assign(
      {},
      {
        _id: headers['x-haravan-order-id'],
        status: headers['x-haravan-topic'],
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
if (process.env.NODE_ENV === 'production') {
  const tmpQueue = []
  router.post('/processOrder', orderMiddleware, (req, res) => {
    if (
      req.order.status === 'orders/cancelled' &&
      req.order.financial_status === 'pending'
    ) {
      req.order.financial_status = 'voided'
    }
    tmpQueue.push(req.order)

    if (tmpQueue.length >= 2)
      try {
        const orders = []
        do {
          orders.push(tmpQueue.shift())
        } while (tmpQueue.length > 0)
        if (orders[0].order_number === orders[1].order_number) orders.shift()

        syncQueue
          .create('sync', {
            orders,
            timestamp: startMeasureTime()
          })
          .priority('normal')
          .attempts(3)
          .removeOnComplete(true)
          .save(err => {
            if (err) throw err
            else res.json({})
          })
      } catch (e) {
        console.log(e.message)
        res.json({})
      }
    else res.json({})
  })
}

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

const replaceThemeString = (tag, content, replacement) =>
  content.replace(
    new RegExp(`(<!--vth:${tag}-->)(.*?)(<!--vth:${tag}:end-->)`, 'gs'),
    `$1${replacement}$3`
  )
function updateTheme(themeId, file, body) {
  return apiPut(`/admin/themes/${themeId}/assets.json`, {
    asset: {
      key: file,
      value: body
    }
  })
}
// TODO
import desktopThemeLiquid from 'raw-loader!@server/templates/desktop-theme.liquid'
import mobileThemeLiquid from 'raw-loader!@server/templates/mobile-theme.liquid'
const mustacheTags = ['<%', '%>']
Mustache.parse(desktopThemeLiquid, mustacheTags)
Mustache.parse(mobileThemeLiquid, mustacheTags)
function updateDesktopTheme(entries) {
  // replace asset css
  const snippetCss = entries
    .filter(([resource]) => /\.css$/.test(resource))
    .map(
      ([resource, hash]) =>
        `<link rel="stylesheet" type="text/css" href="https://static.vaithuhay.com/${resource}?${hash}">`
    )
    .join('')

  // replace assets js
  const snippetJs = entries
    .reverse()
    .filter(([resource]) =>
      /^(frontend|inline|vendor|desktop).*?\.js$/.test(resource)
    )
    .map(
      ([resource, hash]) =>
        `<script type="text/javascript" src="https://static.vaithuhay.com/${resource}?${hash}"></script>`
    )
    .join('')

  // Replace preload js
  const preload = entries
    .reverse()
    .filter(([resource]) =>
      /^(frontend|inline|vendor|desktop).*?\.js$/.test(resource)
    )
    .map(
      ([resource, hash]) =>
        `<link rel="preload" as="script" href="https://static.vaithuhay.com/${resource}?${hash}" crossorigin>`
    )
    .join('')

  return updateTheme(
    process.env.HRV_THEME_D_ID,
    'layout/theme.liquid',
    Mustache.render(
      desktopThemeLiquid,
      { snippetCss, snippetJs, preload },
      {},
      mustacheTags
    )
  )
}
function updateMobileTheme(entries) {
  // replace asset css
  const snippetCss = entries
    .filter(([resource]) => /\.css$/.test(resource))
    .map(
      ([resource, hash]) =>
        `<link rel="stylesheet" type="text/css" href="https://static.vaithuhay.com/${resource}?${hash}">`
    )
    .join('')

  // replace assets js
  const snippetJs = entries
    .reverse()
    .filter(([resource]) =>
      /^(frontend|inline|vendor|mobile).*?\.js$/.test(resource)
    )
    .map(
      ([resource, hash]) =>
        `<script type="text/javascript" src="https://static.vaithuhay.com/${resource}?${hash}"></script>`
    )
    .join('')

  // Replace preload js
  const preload = entries
    .reverse()
    .filter(([resource]) =>
      /^(frontend|inline|vendor|mobile).*?\.js$/.test(resource)
    )
    .map(
      ([resource, hash]) =>
        `<link rel="preload" as="script" href="https://static.vaithuhay.com/${resource}?${hash}" crossorigin>`
    )
    .join('')

  return updateTheme(
    process.env.HRV_THEME_M_ID,
    'layout/theme.liquid',
    Mustache.render(
      mobileThemeLiquid,
      { snippetCss, snippetJs, preload },
      {},
      mustacheTags
    )
  )
}
function updateThemeAll(assets) {
  const entries = Object.entries(assets)
  return Promise.all([updateDesktopTheme(entries), updateMobileTheme(entries)])
}
// console.log(desktopThemeLiquid)
// console.log(mobileThemeLiquid)
router.post('/updateTheme', (req, res) => {
  // update mobile theme
  console.log(req.body)
  updateThemeAll(req.body).then(() => res.json({ status: 'ok' }))
})

export default router
