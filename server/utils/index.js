import request from 'request-promise-native'
import Redis from 'redis'
import Bluebird from 'bluebird'
import './polyfill'
import logUpdate from 'log-update'
import { fork } from 'child_process'
import { HrvAPISelector } from '@server/core/haravan-api'
const loadEnv = require('@server/core/env')
// import 'colors'
Bluebird.promisifyAll(Redis)

export const newProcess = entry => {
  console.log(`start new fork (${entry}) ...`)
  const entryFullPath = `./server-dist/${entry}.${
    process.env.NODE_ENV === 'development' ? 'dev' : 'prod'
  }.js`
  return fork(entryFullPath, {
    env: loadEnv(process.env.APP_RUNTIME_ENV)
  })
}

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
})

// new API EventLoop
const apiPool = new Map(),
  apiThread = newProcess('haravan-api')
apiThread.on('message', ({ err, timestamp, payload }) => {
  if (err) {
    console.error(err)
    return
  }
  const resolve = apiPool.get(timestamp)
  resolve(payload)
  apiPool.delete(timestamp)
  // process.nextTick(() => apiPool.delete(timestamp))
})

const pushQueue = (url, type = 'get', data = {}) =>
  new Promise(resolve => {
    // _getQueue.push({ url, type, data, resolve })
    const timestamp =
      Math.random()
        .toString(36)
        .substring(2, 15) +
      Math.random()
        .toString(36)
        .substring(2, 15)

    apiPool.set(timestamp, resolve)
    apiThread.send({ timestamp, url, type, data })
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
