import request from 'request-promise-native'
import Redis from 'redis'
import Bluebird from 'bluebird'
import './polyfill'
import logUpdate from 'log-update'
// import 'colors'
Bluebird.promisifyAll(Redis)

const flex = obj => {
  let rs
  try {
    rs = JSON.parse(obj)
  } catch (e) {
    rs = obj
  }
  return rs
}

const cache = Redis.createClient({
    prefix: 'vth'
  }),
  delayFn = ms =>
    new Promise(resolve => {
      console.log(`delay ${ms}ms`)
      setTimeout(resolve, ms)
    }),
  _getQueue = [],
  opts = {
    delay: 0,
    delayDefaultInterval: 2000,
    retryCounter: 0,
    reset() {
      opts.delayDefaultInterval = 2000
    },
    maxQueue() {
      if (opts.delay === 0) return 7
      else {
        if (opts.retryCounter === 0) opts.retryCounter = 4
        if (--opts.retryCounter > 0) return 1
        else {
          opts.delay = 0
          return 7
        }
      }
    }
  }

export const HaravanAPI = request.defaults({
  baseUrl:
    'https://c96aab241903b825360305142e40a08a:66921be54a74fe0e36d2671d0c5fb77e@vai-thu-hay-i-something-nice.myharavan.com/'
})
const HaravanAPIAlternative = request.defaults({
    baseUrl:
      'https://0960be1b285c555d784594798247dae8:213dee7cc59da754bd713f633fd48275@vai-thu-hay-i-something-nice.myharavan.com/'
  }),
  HrvAPISelector = () =>
    Math.random() > 0.5 ? HaravanAPI : HaravanAPIAlternative

function loop() {
  const handle = setInterval(async () => {
    const fns = [],
      resolveQueue = async request => {
        const { url, type, data, resolve } = request
        let promise
        switch (type) {
          case 'get':
            promise = () => HrvAPISelector().get(url)
            break
          case 'post':
            promise = () =>
              HrvAPISelector()
                .post(url)
                .json(data)
            break
          case 'put':
            promise = () =>
              HrvAPISelector()
                .put(url)
                .json(data)
            break
          case 'del':
            promise = () => HrvAPISelector().delete(url)
            break
        }
        try {
          const rs = await promise()
          opts.reset()
          resolve(rs)
        } catch (e) {
          //push request back to queue to resolve later
          if (/^429/.test(e.message)) {
            console.log('Retry due to "too many request"')
            opts.delay = opts.delayDefaultInterval += 100
            _getQueue.unshift(request)
          } else {
            console.log(
              `${
                e.message
              }\n Ignore due to unhandled error\n URL: [${type.toUpperCase()}] ${url}`
            )
            resolve({})
          }
        }
      }

    let i = opts.maxQueue()
    if (opts.delay > 0) {
      // await delayFn(opts.delay);
      clearInterval(handle)
      await delayFn(opts.delay)
      loop()
    } else {
      while (--i > 0 && _getQueue.length > 0) fns.push(_getQueue.shift())
      if (fns.length > 0)
        console.log('Process ' + fns.length + ' tasks in queue')
      await Promise.all(fns.map(resolveQueue))
    }
  }, 300)
}

loop()

const pushQueue = (url, type = 'get', data = {}) =>
  new Promise(resolve => {
    _getQueue.push({ url, type, data, resolve })
  })

export async function apiGet(url, _cache = true) {
  let value
  if (_cache) {
    value = await cache.getAsync(url)
    if (!value) {
      value = await pushQueue(url)
    }
  } else value = await pushQueue(url)
  await cache.setAsync(url, value)
  return flex(value)
}

export async function apiPost(url, data) {
  await pushQueue(url, 'post', data)
}

export async function apiPut(url, data) {
  await pushQueue(url, 'put', data)
}

export async function apiDel(url) {
  await pushQueue(url, 'del')
}

export async function apiClear(url) {
  if (typeof url === 'undefined') await cache.flushdb()
  else await cache.del(url)
}

export const log = {
  info: (title, message) => console.log('[' + title + ']' + ' ' + message)
}

export const regex = {
  email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g
}

export { default as createServer } from './createServer'
export { default as diffArray } from './diffArray'
export { default as MutexLock } from './mutexLock'
export { cache }
export const verbose = (...args) => global.VERBOSE && console.log(...args)
verbose.update = (...args) => global.VERBOSE && logUpdate(...args)

export const UploadPathIntoUrl = path =>
  path.replace(/^.*?uploads/, global.APP_HOST + '/uploads')
