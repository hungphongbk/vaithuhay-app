import kue         from 'kue';
import spreadsheet from './Spreadsheet';
// import logging from './Logging'

const syncQueue = kue.createQueue({
  redis: 'redis://b840fc02d524045429941cc15f59e41cb7be6c52@206.189.154.142:9836/'
});

syncQueue
  .on('job enqueue', function (id, type) {
    console.log('Job %s got queued of type %s', id, type);

  })
  .on('job complete', function (id, result) {
    kue.Job.get(id, function (err, job) {
      if (err) return;
      job.remove(function (err) {
        if (err) throw err;
        console.log('removed completed job #%d', job.id);
      });
    });
  });
process.once('SIGTERM', function (sig) {
  syncQueue.shutdown(5000, function (err) {
    console.log('Kue shutdown: ', err || '');
    process.exit(0);
  });
});

syncQueue.process('sync', 1, async ({data: order}, done) => {
  try {
    console.log(`[SYNC] Order ${order.order_number} being proceeded now`);
    await spreadsheet.write([order]);
    console.log(`[SYNC] Order ${order.order_number} has been updated`);
    // await logging.logOrderInfo(order, spreadsheet.emitLog());
    done();
  } catch (e) {
    // await logging.logOrderErr(order, e);
    done(e);
  }
});

export default syncQueue;
