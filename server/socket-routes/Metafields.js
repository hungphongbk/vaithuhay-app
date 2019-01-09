import SocketBase from '@server/socket-routes/SocketBase'
import HaravanClientApi from '@server/utils/HaravanClientAPI'
import { SOCKET_EV } from '@universal/consts'
import { apiGet, cache } from '@server/utils'
import YAML from 'yamljs'
import keyBy from 'lodash/keyBy'
import request from 'request-promise-native'
import moment from 'moment-timezone'
import qs from 'query-string'
import flatten from 'lodash/flatten'
import range from 'lodash/range'
import spreadsheet from '@server/components/Spreadsheet'

class MetafieldsSocketRouter extends SocketBase {
  constructor(io, socket) {
    super(io, socket)
    socket.on('getMetafields', this.getMetafields.bind(this))
    socket.on('deleteMetafield', this.deleteMetafield.bind(this))
    socket.on(SOCKET_EV.Util.OnPatchPrice, this.patchPrice.bind(this))
    socket.on(SOCKET_EV.Util.OnSyncSheet, this.syncSheet.bind(this))
  }

  getMetafields() {
    HaravanClientApi.getMetafields(null, null, true).then(metafields => {
      this.socket.emit('getMetafieldsCompleted', metafields)
    })
  }

  deleteMetafield({ resource, id }) {
    // console.log(resource, id)
    HaravanClientApi.deleteMetafield(resource, id).then(() =>
      this.getMetafields()
    )
  }

  patchPrice() {
    const client = request.defaults({
      baseUrl: 'https://vaithuhay.com'
    })

    return new Promise(async resolve => {
      cache.keys('vthproduct*', async (err, keys) => {
        if (err) {
          console.error(err.message)
          return
        }
        const json = keyBy(
            await Promise.all(
              keys.map(async _key => {
                const key = _key.replace('vthproduct:', '')

                try {
                  const yaml = await client.get(
                    `/products/${key}?view=patch-yaml`
                  )
                  return YAML.parse(yaml)
                } catch (e) {
                  return null
                }
              })
            ),
            'id'
          ),
          patchJSON = JSON.stringify(json)

        console.info(`new patchJSON form size: ${patchJSON.length}`)
        await HaravanClientApi.setMetafield(null, null, null, null)({
          patchJSON
        })
        console.info('Successfully update patch JSON content')
        this.socket.emit(SOCKET_EV.Util.PatchPriceCompleted, {
          status: 'ok',
          data: {
            size: patchJSON.length
          }
        })
        resolve()
      })
    })
  }

  async syncSheet() {
    this.socket.emit(SOCKET_EV.Util.SyncSheetProgress, 'run sync')
    const params = {
        created_at_min: moment()
          .subtract(7, 'days')
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
    this.socket.emit(
      SOCKET_EV.Util.SyncSheetProgress,
      `process ${orders.length} orders`
    )
    await spreadsheet.write(orders.reverse())
    this.socket.emit(SOCKET_EV.Util.SyncSheetCompleted)
  }
}

export default MetafieldsSocketRouter
