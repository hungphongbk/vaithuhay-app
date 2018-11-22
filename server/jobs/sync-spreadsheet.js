import kue from 'kue'
import Spreadsheet from 'google-spreadsheet'
import credentials from './hungphongbk-02e62197a93f.json'
import util from 'util'
import get from 'lodash/get'
import omit from 'lodash/omit'
import { apiGet, MutexLock } from '../utils'
import Log from '../models/Logs'
import moment from 'moment-timezone'

moment.tz.setDefault('Asia/Ho_Chi_Minh')

require('util.promisify').shim()

const syncQueue = kue.createQueue(),
  promisify = util.promisify

const joinKeys = (prefix, obj) => {
  const rs = {}
  for (const [key, value] of Object.entries(obj)) {
    rs[prefix + key] = value
  }
  return rs
}
const _mapHeader = {
  order_number: 'Mã đơn hàng',
  number: 'Id',
  email: 'Email',
  financial_status: 'Tình trạng thanh toán',
  'transactions[0].created_at': 'Thời gian thanh toán',
  'transactions[0].user_id': 'Người xác nhận thanh toán',
  fulfillment_status: 'Tình trạng giao hàng',
  currency: 'Tiền tệ',
  subtotal_price: 'Tổng tiền',
  'shipping_lines[0].price': 'Phí vận chuyển',
  'shipping_lines[0].code': 'Phương thức vận chuyển',
  total_price: 'Tổng cộng',
  total_discounts: 'Số tiền giảm',
  created_at: 'Ngày đặt hàng',
  'line_items[0].quantity': 'Số lượng sản phẩm',
  'line_items[0].name': 'Tên sản phẩm',
  'line_items[0].price': 'Giá bán',
  'line_items[0].price_original': ' Giá gốc',
  'line_items[0].sku': 'Mã sản phẩm',
  ...joinKeys('billing_address.', {
    name: 'Tên người thanh toán',
    address1: 'Billing Street',
    province: 'Tỉnh/TP thanh toán',
    country: 'Quốc gia',
    phone: 'Số điện thoại thanh toán'
  }),
  ...joinKeys('shipping_address.', {
    name: 'Tên người nhận',
    address1: 'Shipping Street',
    ward: 'Phường/Xã nhận hàng',
    district: 'Quận/Huyện nhận hàng',
    province: 'Tỉnh/TP nhận hàng',
    country: 'Quốc gia nhận hàng',
    phone: 'Số điện thoại'
  }),
  ...joinKeys('fulfillments[0].', {
    tracking_number: 'Mã vận đơn',
    carrier_status_name: 'Trạng thái vận chuyển',
    cod_amount: 'Số tiền thu hộ',
    carrier_cod_status_name: 'Tình trạng thu hộ'
  }),
  note: 'Ghi chú',
  cancelled_at: 'Ngày hủy',
  'refunds[0].user_id': 'Người hủy',
  cancelled_status: 'Trạng thái hủy',
  gateway: 'Phương thức thanh toán',
  tags: 'Tags',
  source_name: 'Kênh bán hàng',
  referring_site: 'Trang dẫn tới',
  user_id: 'Người tạo',
  confirmed_at: 'Ngày xác thực',
  'discount_codes[0].code': 'Mã khuyến mãi'
}

async function getValue(_obj, key) {
  const val = get(_obj, key)
  if (typeof val === 'undefined' || val === null) return ''
  if (/confirmed_at$/.test(key)) {
    if (typeof val !== 'string') return ''
    const m = moment(val)
    // console.log([val, 'UTC' + m.utcOffset() / 60, 'hour = ' + m.hour()].join(' | '));
    return m.format('DD-MM-YYYY')
  }
  if (/_at$/.test(key)) {
    if (typeof val !== 'string') return ''
    const m = moment(val)
    // console.log([val, 'UTC' + m.utcOffset() / 60, 'hour = ' + m.hour()].join(' | '));
    return m.format('DD-MM-YYYY HH:MM:SS')
  }
  switch (key) {
    case 'financial_status':
      return {
        pending: 'Chờ xử lý',
        voided: 'Đã hủy',
        refunded: 'Đã nhập trả',
        paid: 'Đã thanh toán'
      }[val]
    case 'fulfillment_status':
      return val === 'notfulfilled' ? 'Chưa hoàn thành' : 'Đã hoàn thành'
    case 'cancelled_status':
      return /un/.test(val) ? 'No' : 'Yes'
    case 'transactions[0].user_id':
    case 'user_id':
    case 'refunds[0].user_id':
      if (val * 1 === 0) return ''
      const { users } = await apiGet('/admin/users.json'),
        user = users.find(u => u.id * 1 === val * 1)
      if (user) return user.last_name.trim() + ' ' + user.first_name.trim()
      else return ''
    default:
      return val
  }
}

const transKey = key => key.replace(/[\s\/]/g, '').toLowerCase()

class Row {
  constructor(row, index = 0) {
    this.$row = row
    this.index = index
    for (const key of Object.keys(_mapHeader)) {
      // console.log(transKey(_mapHeader[key]));
      Object.defineProperty(this, key, {
        get() {
          return row[transKey(_mapHeader[key])]
        },
        set(value) {
          row[transKey(_mapHeader[key])] = value
        }
      })
    }
  }

  /**
   *
   * @param sheet
   * @param {number} index
   * @param _obj
   * @returns {Promise<Row>}
   */
  static async create(sheet, index, _obj) {
    const obj = {}
    for (const key of Object.keys(_mapHeader)) {
      obj[transKey(_mapHeader[key])] = await getValue(_obj, key)
    }
    return new Row(await promisify(sheet.addRow)(obj), index)
  }

  async update(_obj) {
    for (const key of Object.keys(_mapHeader)) {
      this.$row[transKey(_mapHeader[key])] = await getValue(_obj, key)
    }
    // console.log('update done');
  }

  _setExternal(entries) {
    for (const [key, value] of Object.entries(entries)) {
      this.$row[key] = value
    }
  }

  setExternal(_index = 0) {
    const index = _index || this.index
    if (index !== 0)
      this._setExternal({
        groupa: `=iferror(VLOOKUP(T${index};'Item list (lnk)'!A:F;5;0))`,
        promotion: `=if(S${index}>0;(S${index}-R${index})*P${index};)`,
        trạngtháixuấtkho: `=IFERROR(VLOOKUP(A${index};'Dispatch (lnk)'!C:D;2;0);)`,
        ...(process.env.NODE_ENV === 'development'
          ? {
              devstatus: `OK ${this.order_number}`
            }
          : {})
      })
  }

  save() {
    const self = this
    self.setExternal()
    return new Promise((resolve, reject) => {
      self.$row.save(err => {
        if (err) {
          console.log(err.message)
          reject(err)
        } else resolve()
      })
    })
  }
}

let _sheet = null

syncQueue
  .on('job enqueue', function(id, type) {
    console.log('Job %s got queued of type %s', id, type)
  })
  .on('job complete', function(id, result) {
    kue.Job.get(id, function(err, job) {
      if (err) return
      job.remove(function(err) {
        if (err) throw err
        console.log('removed completed job #%d', job.id)
      })
    })
  })
process.once('SIGTERM', function(sig) {
  syncQueue.shutdown(5000, function(err) {
    console.log('Kue shutdown: ', err || '')
    process.exit(0)
  })
})

async function getSheet() {
  if (_sheet) return _sheet
  //set Auth
  const doc = new Spreadsheet('1n3H8FNUmAHEtoViNqGevOuESHAwitGdBOuf92YkjuDI')
  await promisify(doc.useServiceAccountAuth)(credentials)
  const { worksheets } = await promisify(doc.getInfo)()
  _sheet = worksheets[0]
  return _sheet
}

async function writeEventLog(order) {
  try {
    const log = new Log({
      category: 'haravan_order_data',
      key: `order${order.order_number}/${order.status}`,
      value: JSON.stringify(order)
    })
    await log.save()
  } catch (e) {
    throw e
  }
}

// store log after succeeded
syncQueue.process('sync', 1, async ({ data: order }, done) => {
  //console.log(order.order_number + ' / ' + order.status + ' / ' + order.financial_status);
  if (
    order.status === 'orders/cancelled' &&
    order.financial_status === 'pending'
  ) {
    order.financial_status = 'voided'
  }
  // console.log('financial status = '+order.financial_status);
  try {
    const sheet = await getSheet(),
      rows = await promisify(sheet.getRows)({
        offset: 4000
      })

    // console.log(`Queried ${rows.length} rows`);
    // find row by order_number, else create new row
    let founds = [],
      rowCount = rows.length + 4001

    await Promise.all(
      rows.map(
        (r, index) =>
          new Promise(async resolve => {
            const rowWrapper = new Row(r, index + 4001)
            if (rowWrapper.order_number === order.order_number)
              founds.push(rowWrapper)
            resolve()
          })
      )
    )

    //transform order by line item index
    const transform = (order, line_item = null) => {
      const rs = omit(order, ['_id', 'status']),
        line_items = rs.line_items
      if (line_item === null) return rs
      if (typeof line_item === 'number') rs.line_items = [line_items[line_item]]
      else if (typeof line_items === 'object') rs.line_items = [line_item]
      return rs
    }
    const lock = new MutexLock()
    if (founds.length === 0) {
      // CREATE NEW ROWS
      // each row identified by line item
      console.log('create new order!')
      founds.push(
        ...(await Promise.all(
          order.line_items.map(line_item => {
            return new Promise(async resolve => {
              await lock.acquire()
              console.log('index = ' + rowCount)
              const r = await Row.create(
                sheet,
                rowCount++,
                transform(order, line_item)
              )
              lock.release()
              resolve(r)
            })
          })
        ))
      )
      // founds.push(await Row.create(sheet, omit(order, [
      //   '_id', 'status'
      // ])));
    } else {
      //UPDATE EXISTING ROWS
      console.log(`[SYNC] update existing order (${order.order_number})`)
      await Promise.all(
        founds.map(
          (f, lineItemIndex) =>
            new Promise(resolve =>
              f.update(transform(order, lineItemIndex)).then(resolve)
            )
        )
      )
    }
    await Promise.all(founds.map(f => f.save()))
    await writeEventLog(order)
    console.log(`[SYNC] Order ${order.order_number} has been updated!`)
    done()
  } catch (e) {
    console.log(e)
    done(e)
  }
})

if (process.env.NODE_ENV === 'development') {
  const OrderProcess = require('../models/OrderProcess').default
  syncQueue.process('checkOrder', 4, async ({ data: { orders } }, done) => {
    //Get order numbers
    const order_numbers = orders.map(o => o.order_number),
      order_ids = orders.map(o => o.number)

    try {
      const sheet = await getSheet(),
        rows = await promisify(sheet.getRows)({
          offset: 3000
        })
      // console.log(`Queried ${rows.length} rows`);
      // find row by order_number, else create new row
      let founds = []
      await Promise.all(
        rows.map(
          (r, index) =>
            new Promise(async resolve => {
              const rowWrapper = new Row(r, index + 3001)
              // console.log('    ' + rowWrapper.order_number);
              if (order_ids.indexOf(rowWrapper.number) >= 0)
                founds.push({
                  row: rowWrapper,
                  order: orders.find(o => o.number === rowWrapper.number),
                  index: index + 3001
                })
              resolve()
            })
        )
      )

      //transform order by line item index
      const transform = (order, arr = [], obj = false) => {
        const rs = omit(order, ['_id', 'status']),
          line_items = rs.line_items

        if (obj) {
          rs.line_items = [arr]
        } else {
          const { order_number } = order

          if (typeof arr[order_number] === 'undefined') arr[order_number] = 0
          else arr[order_number]++
          const index = arr[order_number]

          rs.line_items = [line_items[index]]
        }
        return rs
      }

      if (founds.length === 0) {
        // CREATE NEW ROWS
        // each row identified by line item
        console.log('[CHECK-ORDER] create new order!')
        for (const order of orders)
          founds.push(
            ...(await Promise.all(
              order.line_items.map(
                line_item =>
                  new Promise(resolve =>
                    Row.create(
                      sheet,
                      0,
                      transform(order, line_item, true)
                    ).then(row => resolve(row))
                  )
              )
            )).map(row => ({ row }))
          )
        // founds.push(await Row.create(sheet, omit(order, [
        //   '_id', 'status'
        // ])));
      } else {
        console.log('founds ', founds[0].row.order_number, founds[0].index)
        //UPDATE EXISTING ROWS
        // console.log(`[CHECK-ORDER] update existing order (${order.order_number})`);
        const lineItemIndexes = []
        await Promise.all(
          founds.map(
            ({ row, order }) =>
              new Promise(resolve =>
                row.update(transform(order, lineItemIndexes)).then(resolve)
              )
          )
        )
      }
      const saveToSheetFn = Promise.all(founds.map(({ row }) => row.save()))
      const updateProceeded = Promise.all(
        order_numbers.map(
          number =>
            new Promise((resolve, reject) => {
              const p = new OrderProcess({
                number,
                processed: true
              })
              p.save(err => {
                if (err) {
                  console.error(err.message)
                  reject(err)
                } else resolve()
              })
            })
        )
      )
      await Promise.all([saveToSheetFn, updateProceeded])
      syncQueue.inactiveCount(function(err, remains) {
        console.log(
          `[CHECK-ORDER] Order ${order_numbers.join(', ')} has been updated`
        )
        console.log(`${remains} orders left!`)
        done()
      })
      // await writeEventLog(order);
    } catch (e) {
      console.error(e)
      done(e)
    }
  })
}

export default syncQueue
