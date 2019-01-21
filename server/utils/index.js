import request from 'request-promise-native'
import Redis from 'redis'
import Bluebird from 'bluebird'
import './polyfill'
import logUpdate from 'log-update'
import { fork } from 'child_process'
import Cluster from 'cluster'
import { HrvAPISelector } from '@server/core/haravan-api'
import { randomHash } from '@universal/helpers'
const loadEnv = require('@server/core/env')
import chai from 'chai'

const expect = chai.expect
// import 'colors'
Bluebird.promisifyAll(Redis)

//region Process management
let newDevProcess, newProdProcess
if (process.env.NODE_ENV === 'development') {
  newDevProcess = entry => {
    console.log(`start new fork (${entry}) ...`)
    const entryFullPath = `./server-dist/${entry}.dev.js`
    Cluster.setupMaster({
      exec: entryFullPath
    })
    const childProc = Cluster.fork(loadEnv(process.env.APP_RUNTIME_ENV))
    process.on('exit', () => {
      console.log(`process [${entry}] will be terminated soon.`)
      childProc.kill()
    })

    return childProc
  }
} else
  newProdProcess = entry => {
    console.log(`start new fork (${entry}) ...`)
    const entryFullPath = `./server-dist/${entry}.prod.js`
    const childProc = fork(entryFullPath, {
      env: loadEnv(process.env.APP_RUNTIME_ENV)
    })
    process.on('exit', () => {
      console.log(`process [${entry}] will be terminated soon.`)
      childProc.kill()
    })

    return childProc
  }
export const newProcess =
  process.env.NODE_ENV === 'development' ? newDevProcess : newProdProcess
//endregion

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
  if (resolve) {
    resolve(payload)
    apiPool.delete(timestamp)
  } else {
    console.log(`#${timestamp} not found!`)
  }
  // process.nextTick(() => apiPool.delete(timestamp))
})

const pushQueue = (url, type = 'get', data = {}) =>
  new Promise(resolve => {
    // _getQueue.push({ url, type, data, resolve })
    const timestamp = randomHash()

    apiPool.set(timestamp, resolve)
    //for debug
    // process.env.APP_RUNTIME_ENV === 'cli' && console.log(apiPool.keys())
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

/**
 * Delete cached URL from Redis
 * @param url
 * @param withPattern
 * @returns {Promise<void>}
 */
export async function apiClear(url, withPattern = false) {
  if (typeof url === 'undefined') await cache.flushdb()
  else if (!withPattern) await cache.del(url)
  else {
    //replace glob-pattern characters (? * [ ] - ^)
    let globUrl = 'vth' + url.replace(/([?\*\-\[\]\-^])/g, '\\$1') + '*'
    return cache.keys(globUrl, async (err, keys) => {
      expect(err).to.be.null
      expect(keys).to.have.lengthOf.above(
        0,
        `fuck ${url} doesn't exist in Redis cache\r\nglob: ${globUrl}`
      )

      await cache.del(keys.join(' '))
      if (process.env.NODE_ENV === 'development') {
        console.log('Completed remove keys:')
        for (const key of keys) console.log('    ' + key.replace(/^vth/g, ''))
      }
    })
  }
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
