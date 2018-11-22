import spreadsheet from '@server/components/Spreadsheet'
import { apiGet } from '@server/utils'
import moment from 'moment-timezone'
import qs from 'query-string'
import range from 'lodash/range'
import flatten from 'lodash/flatten'

const filterAsync = (array, filter) =>
  Promise.all(array.map(entry => filter(entry))).then(bits =>
    array.filter(entry => bits.shift())
  )

const test1 = async () => {
  const params = {
      created_at_min: moment()
        .subtract(30, 'days')
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
}
const test2 = async () => {
  const data = await spreadsheet._cacheSheetData()
  console.log(data[0])
}

export default async () => {
  await test1()
  process.exit(0)
}
