import EventEmitter from 'events'
import HaravanClientApi from '@server/utils/HaravanClientAPI'

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
    console.log('Homepage metafield has changed. Execute hook')

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
        const image = { ...item.data.image }
        ;['uuid', 'storage', 'host', '_id'].forEach(prop => {
          delete image.desktop[prop]
          delete image.mobile[prop]
        })
        layoutJSON.push({
          type: 'Banner',
          banner: image
        })
      } else if (item.type === 'Promotions') {
        layoutJSON.push({
          type: 'Promotions'
        })
      }
    }
    if (process.env.NODE_ENV === 'development')
      console.log(JSON.stringify(layoutJSON).length)
    const parts = JSON.stringify(layoutJSON).match(/.{1,79999}/g),
      layoutJSONParts = {}
    parts.forEach((part, index) => {
      layoutJSONParts[`layoutJSON${index + 1}`] = part
    })
    console.log(Object.keys(layoutJSONParts))

    await HaravanClientApi.setMetafield(null, null, null, null)(layoutJSONParts)
    console.log('Successfully update index page')
  }
}

const MetafieldsEventHook = new MetafieldsEventHookClass()
export default MetafieldsEventHook
