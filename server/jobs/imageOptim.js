import { newProcess } from '@server/utils'
import { randomHash } from '@universal/helpers'
import { PROC_EV } from '@universal/consts'

const imageOptimProc = newProcess('image-optim'),
  cachedStorage = new Map(),
  pool = new Map()

imageOptimProc.on('message', ({ err = null, uid, payload }) => {
  if (err) {
    console.error(err)
    return
  }

  const resolve = pool.get(uid)
  if (resolve) {
    resolve(payload)
    pool.delete(uid)
  } else console.error(`#${timestamp} not found!`)
})
function pushQueue(type, payload) {
  const uid = randomHash()
  return new Promise(resolve => {
    pool.set(uid, resolve)
    imageOptimProc.send({ type, uid, payload })
  })
}

export function compressImageToWebp(url) {
  // console.log(url)
  return cachedStorage.has(url)
    ? Promise.resolve(cachedStorage.get(url))
    : pushQueue(PROC_EV.ConvertImageToWebp, url).then(cached => {
        cachedStorage.set(url, cached)
        return cached
      })
}

export { cachedStorage }
