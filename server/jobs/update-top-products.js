import { HaravanAPI, apiGet, apiPost } from '../utils/index'

const updateTopProducts = async (arr, namespace, resources = '') => {
  const { metafields } = await apiGet(
    `/admin${resources}/metafields.json?namespace=${namespace}`
  )
  if (metafields.length > 0) {
    await Promise.all(
      metafields.map(
        ({ id, namespace: _namespace }) =>
          new Promise(async resolve => {
            if (namespace === _namespace)
              await HaravanAPI.delete(
                `/admin${resources}/metafields/${id}.json`
              )
            resolve()
          })
      )
    )
  }
  await timeout(11000)
  await Promise.all(
    arr.map(
      ([id, handle]) =>
        new Promise(async resolve => {
          try {
            await apiPost(`/admin${resources}/metafields.json`, {
              metafield: {
                namespace,
                key: JSON.stringify(id),
                value_type: 'string',
                value: handle
              }
            })
          } catch (e) {
            throw e
          }
          resolve()
        })
    )
  )
}
