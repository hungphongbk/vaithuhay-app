import createQueue from '@server/jobs/classes/createQueue'
import { HrvAPISelector } from '@server/core/haravan-api'

const latency = 50,
  concurrencySize = 8

const queue = createQueue()

queue.process('request', concurrencySize, async (job, done) => {
  function processDone(err, payload) {
    function delayDone(err) {
      setTimeout(() => done(err), latency)
    }
    if (err) {
      process.send({ err })
      delayDone(err)
    } else {
      process.send(payload)
      delayDone()
    }
  }

  const { url, type, data, timestamp } = job.data
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
    const payload = await promise()
    processDone(null, { timestamp, payload })
  } catch (e) {
    if (/^429/.test(e.message)) {
      console.log('Retry due to "too many request"')
      // opts.delay = opts.delayDefaultInterval += 100
      processDone(new Error('Retry due to "too many request"'))
    } else {
      console.log(
        `${
          e.message
        }\n Ignore due to unhandled error\n URL: [${type.toUpperCase()}] ${url}`
      )
      processDone(null, {})
    }
  }
})

process.on('message', payload => {
  queue.create('request', payload).save(err => {
    if (err) process.send({ err })
    // else console.log(payload.timestamp)
  })
})
