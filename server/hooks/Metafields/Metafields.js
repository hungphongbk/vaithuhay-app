import EventEmitter from 'events'
import HaravanClientApi from '@server/utils/HaravanClientAPI'
import { chunkMetafieldJsonString } from '@server/utils/helpers'
import ServiceContainers from '@server/core/containers'
import { SOCKET_EV } from '@universal/consts'
import { bytesToSize } from '@universal/helpers'

class MetafieldsEventHookClass extends EventEmitter {
  constructor() {
    super()
    const fnHookTableItem = (regex, method, cb) => ({ regex, method, cb })
    this.hookTable = [
      fnHookTableItem(
        /^\/meta\?key=homepage/,
        'post',
        this.homepageMetafield.bind(this)
      )
    ]

    this.on('hook', ({ url, method, payload = {} }) => {
      let found = null
      console.log(url)
      for (const item of this.hookTable)
        if (!found && url.match(item.regex) && method === item.method) {
          found = item
        }
      if (found) found.cb(payload)
    })
  }

  async homepageMetafield(payload) {
    const { Util } = SOCKET_EV,
      log = (eventName, message = '') =>
        ServiceContainers.call('io', io => {
          io.emit(eventName, message)
        })

    /**
     * 1. Clear collection caches in redis
     */
    await HaravanClientApi.cache.invalidateCollection()

    await log(Util.UpdateIndexJson)
    await log(
      Util.UpdateIndexJsonProgress,
      'Homepage metafield has changed. Execute hook...'
    )

    const layoutJSON = []
    for (const item of payload.layout) {
      if (item.type === 'CollectionSlider') {
        layoutJSON.push({
          type: 'CollectionSlider',
          collections: await Promise.all(
            item.data.collections.map(id => HaravanClientApi.getCollection(id))
          ),
          ui: item.data.ui
        })
      } else if (item.type === 'Banner') {
        //refine images
        const banner = { ...item.data }
        ;['uuid', 'storage', 'host', '_id'].forEach(prop => {
          delete banner.image.desktop[prop]
          delete banner.image.mobile[prop]
        })
        layoutJSON.push({
          type: 'Banner',
          banner
        })
      } else if (item.type === 'Promotions') {
        layoutJSON.push({
          type: 'Promotions'
        })
      }
    }
    if (process.env.NODE_ENV === 'development')
      console.log(JSON.stringify(layoutJSON).length)
    const layoutJSONParts = chunkMetafieldJsonString(
      JSON.stringify(layoutJSON),
      'layoutJSON'
    )

    await HaravanClientApi.setMetafield(null, null, null, null)(layoutJSONParts)
    await log(
      Util.UpdateIndexJsonProgress,
      `Successfully update index page (size = ${bytesToSize(
        JSON.stringify(layoutJSON).length
      )})`
    )
    await log(Util.UpdateIndexJsonCompleted)
  }
}

const MetafieldsEventHook = new MetafieldsEventHookClass()
export default MetafieldsEventHook
