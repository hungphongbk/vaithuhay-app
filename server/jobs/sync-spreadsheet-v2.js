// import kue from 'kue'
import spreadsheet from '../components/Spreadsheet'
import createQueue from '@server/jobs/classes/createQueue'
import { endMeasureTime } from '@universal/helpers'
// import logging from './Logging'
// import Profiler from 'v8-profiler-node8'
// import fs from 'fs'
// import path from 'path'

const syncQueue = createQueue()
process.once('SIGTERM', function(sig) {
  syncQueue.shutdown(5000, function(err) {
    console.log('Kue shutdown: ', err || '')
    process.exit(0)
  })
})

syncQueue.process('sync', 1, async ({ data: order }, done) => {
  // const id = Date.now() + '.profile'
  // start profiling
  // Profiler.startProfiling(id)

  try {
    console.log(`[SYNC] Order ${order.order_number} being proceeded now`)
    const handler = order.__timestamp
    await spreadsheet.write([order])
    if (handler)
      endMeasureTime(handler, sec => {
        console.log(
          `[SYNC] Order ${
            order.order_number
          } has been updated, time elapsed: ${sec} seconds`
        )
      })
    else console.log(`[SYNC] Order ${order.order_number} has been updated`)
    // await logging.logOrderInfo(order, spreadsheet.emitLog());
    // const profile = JSON.stringify(Profiler.stopProfiling(id))
    // fs.writeFile(
    //   path.join(global.APP_PATH, '../.profiling/' + id),
    //   profile,
    //   () => {
    //     console.log('Completed profiling. Output: ' + id)
    done()
    // }
    // )
  } catch (e) {
    // await logging.logOrderErr(order, e);
    done(e)
  }
})

export default syncQueue
