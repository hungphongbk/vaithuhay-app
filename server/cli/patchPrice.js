import { cache } from '@server/utils'
import { promisify } from 'bluebird'
import request from 'request-promise-native'
import YAML from 'yamljs'
import keyBy from 'lodash/keyBy'
import HaravanClientApi from '@server/utils/HaravanClientAPI'

export default () => {
  const client = request.defaults({
    baseUrl: 'https://vaithuhay.com'
  })

  return new Promise(async resolve => {
    cache.keys('vthproduct:*', async (err, keys) => {
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

      console.log(patchJSON.length)
      await HaravanClientApi.setMetafield(null, null, null, null)({
        patchJSON
      })
      console.log('Successfully update patch JSON content')
      resolve()
    })
  })
}
